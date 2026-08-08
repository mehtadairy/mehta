import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { WhatsAppService } from '@/lib/services/whatsapp';
import { verifyCustomerSession } from '@/lib/auth-utils';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { orderId, reason } = await request.json();

    if (!orderId || !reason) {
      return NextResponse.json({ error: 'Order ID and reason are required' }, { status: 400 });
    }

    // 1. Authenticate
    let customerId = null;
    let customerPhone = null;
    const cookieStore = await cookies();
    const token = cookieStore.get('mehta_customer_token')?.value;
    if (token) {
      const payload = await verifyCustomerSession(token);
      if (payload?.id) {
        customerId = payload.id;
        customerPhone = payload.phone;
      }
    }
    if (!customerId) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader) {
        const authToken = authHeader.replace('Bearer ', '');
        const { data } = await supabase.auth.getUser(authToken);
        if (data?.user) {
          customerId = data.user.id;
          customerPhone = data.user.phone;
        }
      }
    }

    if (!customerId) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    // 2. Fetch Order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 3. Verify Ownership (via customer_id or phone matching)
    const getClean10DigitPhone = (phone: string) => (phone || '').replace(/\D/g, '').slice(-10);
    const isOwner = (order.customer_id && order.customer_id === customerId) ||
      (customerPhone && getClean10DigitPhone(order.user_phone) === getClean10DigitPhone(customerPhone));

    if (!isOwner) {
      return NextResponse.json({ error: 'You do not have permission to cancel this order.' }, { status: 403 });
    }

    // 4. Check Status Eligibility
    const uncancelableStatuses = ['Preparing', 'Packed', 'Ready', 'Ready For Pickup', 'Out for Delivery', 'Shipped', 'Delivered'];
    if (uncancelableStatuses.includes(order.status)) {
      return NextResponse.json({ error: 'This order has already entered preparation and can no longer be cancelled online.' }, { status: 400 });
    }

    if (order.status === 'Cancelled' || order.status === 'Cancellation Requested') {
      return NextResponse.json({ error: 'Order is already cancelled or cancellation is requested.' }, { status: 400 });
    }

    // 5. Determine Payment and Refund Logic
    const isOnlinePayment = order.payment_method === 'Razorpay' || order.payment_method === 'Online';
    const isPaid = order.payment_status?.toLowerCase() === 'paid';
    
    let refundStatus = 'N/A';

    if (isOnlinePayment) {
      if (!isPaid) {
        return NextResponse.json({ error: 'Order payment was not completed or captured. Cannot process refund.' }, { status: 400 });
      }

      if (!order.payment_id || !order.payment_id.startsWith('pay_')) {
        return NextResponse.json({ error: 'Invalid payment ID. Cannot process refund automatically.' }, { status: 400 });
      }

      // 5a. Prevent Double Refunds & Reconcile Existing Refunds
      const keyId = process.env.RAZORPAY_KEY_ID || '';
      const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
      const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const amountInPaise = Math.round(order.total * 100);

      const { data: existingRefund } = await supabase
        .from('refunds')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle();

      let targetRefundRecord = existingRefund;

      if (existingRefund) {
        if (existingRefund.status === 'PROCESSED') {
          return NextResponse.json({ 
            success: true, 
            message: 'A refund has already been processed for this order.',
            status: 'Cancelled',
            refundStatus: 'Completed' 
          });
        }

        if (existingRefund.status === 'REVERSED') {
          return NextResponse.json({
            success: true,
            message: 'The refund for this order was reversed.',
            status: 'Cancelled',
            refundStatus: 'Reversed'
          });
        }

        // Reconcile PENDING / FAILED refund with Razorpay API
        try {
          const checkRes = await fetch(`https://api.razorpay.com/v1/payments/${order.payment_id}/refunds`, {
            method: 'GET',
            headers: { 'Authorization': authHeader }
          });

          if (checkRes.ok) {
            const checkData = await checkRes.json();
            const items = checkData.items || [];
            const matchedRefund = items.find((item: any) => 
              item.notes?.order_id === order.id || 
              item.id === existingRefund.razorpay_refund_id ||
              Math.abs(item.amount - amountInPaise) < 1
            );

            if (matchedRefund) {
              const rzpStatus = matchedRefund.status;
              const mappedStatus = rzpStatus === 'processed' ? 'PROCESSED' : rzpStatus === 'reversed' ? 'REVERSED' : rzpStatus === 'failed' ? 'FAILED' : 'PENDING';
              
              await supabase
                .from('refunds')
                .update({
                  razorpay_refund_id: matchedRefund.id,
                  status: mappedStatus,
                  processed_at: rzpStatus === 'processed' ? new Date().toISOString() : existingRefund.processed_at,
                  reversed_at: rzpStatus === 'reversed' ? new Date().toISOString() : existingRefund.reversed_at,
                  metadata: {
                    ...(existingRefund.metadata || {}),
                    reconciled_at: new Date().toISOString(),
                    razorpay_response: matchedRefund
                  }
                })
                .eq('id', existingRefund.id);

              const mappedPaymentStatus = mappedStatus === 'PROCESSED' ? 'Refund Completed' : mappedStatus === 'REVERSED' ? 'Refund Reversed' : mappedStatus === 'FAILED' ? 'Refund Failed' : 'Refund Initiated';

              await supabase
                .from('orders')
                .update({ status: 'Cancelled', payment_status: mappedPaymentStatus })
                .eq('id', order.id);

              return NextResponse.json({
                success: true,
                message: `Refund reconciled with status: ${mappedStatus}`,
                status: 'Cancelled',
                refundStatus: mappedStatus === 'PROCESSED' ? 'Completed' : mappedStatus === 'REVERSED' ? 'Reversed' : mappedStatus === 'FAILED' ? 'Failed' : 'Initiated'
              });
            }
          }
        } catch (recErr) {
          console.warn("[CancelOrder] Non-blocking warning: Failed to reconcile refund with Razorpay:", recErr);
        }
      }

      // 5b. FAILURE-SAFE STEP 1: Create or reuse PENDING refund record BEFORE calling Razorpay POST
      const idempotencyKey = targetRefundRecord?.metadata?.idempotency_key || `refund_${order.id}`;

      if (!targetRefundRecord) {
        const { data: newRefund, error: insertErr } = await supabase
          .from('refunds')
          .insert([{
            order_id: order.id,
            payment_id: order.payment_id,
            amount: order.total,
            currency: 'INR',
            status: 'PENDING',
            reason: reason,
            metadata: { idempotency_key: idempotencyKey }
          }])
          .select()
          .single();

        if (insertErr && insertErr.code !== '23505') { // 23505 = unique constraint violation
          console.error("[CancelOrder] Failed to create pending refund record:", insertErr);
          return NextResponse.json({ error: 'Failed to initialize refund record in database.' }, { status: 500 });
        }
        targetRefundRecord = newRefund;
      }

      // 5c. FAILURE-SAFE STEP 2 & 3: Call Razorpay Refund API with X-Refund-Idempotency header
      try {
        const rzpRes = await fetch(`https://api.razorpay.com/v1/payments/${order.payment_id}/refund`, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
            'X-Refund-Idempotency': idempotencyKey
          },
          body: JSON.stringify({
            amount: amountInPaise,
            notes: {
              order_id: order.id,
              reason: reason
            }
          })
        });

        const rzpData = await rzpRes.json();

        if (!rzpRes.ok || rzpData.error) {
          const failReason = rzpData.error?.description || rzpData.error?.code || 'Razorpay refund failed';
          console.error("[CancelOrder] Razorpay refund error:", rzpData);

          await supabase
            .from('refunds')
            .update({
              status: 'FAILED',
              failed_at: new Date().toISOString(),
              failure_reason: failReason
            })
            .eq('order_id', order.id);

          return NextResponse.json({ 
            error: `Razorpay Refund Error: ${failReason}` 
          }, { status: 500 });
        }

        // 5d. Save razorpay_refund_id and status
        const isProcessed = rzpData.status === 'processed';
        const isReversed = rzpData.status === 'reversed';
        const isFailed = rzpData.status === 'failed';
        
        refundStatus = isProcessed ? 'Completed' : isReversed ? 'Reversed' : isFailed ? 'Failed' : 'Initiated';
        const finalRefundStatusDB = isProcessed ? 'PROCESSED' : isReversed ? 'REVERSED' : isFailed ? 'FAILED' : 'PENDING';

        await supabase
          .from('refunds')
          .update({
            razorpay_refund_id: rzpData.id,
            status: finalRefundStatusDB,
            processed_at: isProcessed ? new Date().toISOString() : null,
            reversed_at: isReversed ? new Date().toISOString() : null,
            failed_at: isFailed ? new Date().toISOString() : null,
            metadata: {
              ...(targetRefundRecord?.metadata || {}),
              razorpay_response: rzpData
            }
          })
          .eq('order_id', order.id);

      } catch (rzpErr: any) {
        console.error("[CancelOrder] Exception calling Razorpay Refund API:", rzpErr);

        await supabase
          .from('refunds')
          .update({
            status: 'FAILED',
            failed_at: new Date().toISOString(),
            failure_reason: rzpErr.message || 'Network error initiating refund'
          })
          .eq('order_id', order.id);

        return NextResponse.json({ error: 'Network error communicating with Razorpay for refund.' }, { status: 500 });
      }
    }

    const newStatus = 'Cancelled';
    const finalPaymentStatus = isOnlinePayment 
      ? (refundStatus === 'Completed' ? 'Refund Completed' : 'Refund Initiated')
      : order.payment_status;

    // 6. Update Order Status
    const primaryPayload: any = {
      status: newStatus,
      payment_status: finalPaymentStatus,
      cancelled_by: 'Customer',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason
    };

    let { error: updateError } = await supabase
      .from('orders')
      .update(primaryPayload)
      .eq('id', orderId);

    if (updateError) {
      console.warn("[CancelOrder] Primary update failed with optional columns, retrying minimal essential update:", updateError.message);
      const minimalRes = await supabase
        .from('orders')
        .update({
          status: newStatus,
          payment_status: finalPaymentStatus
        })
        .eq('id', orderId);

      if (minimalRes.error) {
        console.error("[CancelOrder] Essential order status update failed:", minimalRes.error);
        return NextResponse.json({ error: 'Failed to update order status: ' + minimalRes.error.message }, { status: 500 });
      }
    }

    // 7. Audit Log (Non-blocking fallback)
    try {
      const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown';
      const userAgent = request.headers.get('user-agent') || 'Unknown';

      await supabase.from('order_cancellations').insert([{
        order_id: orderId,
        order_number: order.order_number,
        customer_id: customerId,
        cancelled_by: 'Customer',
        reason: reason,
        ip_address: ip,
        device: userAgent,
        refund_status: refundStatus
      }]);
    } catch (auditErr) {
      console.warn("[CancelOrder] Audit log insert warning:", auditErr);
    }

    // 8. Restore Inventory
    if (order.order_items && order.order_items.length > 0) {
      for (const item of order.order_items) {
        if (item.product_id && item.quantity) {
          // We fetch current stock, then increment. Supabase RPC would be better, but we do standard select/update.
          const { data: prod } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
          if (prod) {
            await supabase.from('products').update({ stock: (prod.stock || 0) + item.quantity }).eq('id', item.product_id);
          }
        }
      }
    }

    // 9. Handle Print Agent Cancellation Slip Queueing
    try {
      const { PrintingService } = await import('@/lib/services/printing');
      const branchId = (order.shipping_address as any)?.branch_id || 'Main';
      await PrintingService.queueOrderCancellationPrint(order, reason, branchId);
    } catch (printErr) {
      console.error("[CancelOrder] Failed to queue cancellation print slip:", printErr);
    }

    // 10. Notify Admin
    const adminMsg = `Customer cancelled Order ${order.order_number} - ${reason}`;
    await supabase.from('notifications').insert([{
      title: refundStatus === 'Initiated' ? "🟠 Refund Initiated" : "🔴 Order Cancelled",
      message: adminMsg,
      type: 'admin',
      order_id: order.id
    }]);

    // 11. WhatsApp Notification
    const cleanPhone = order.user_phone ? `91${order.user_phone.replace(/\D/g, '').slice(-10)}` : '';
    if (cleanPhone) {
      try {
        let msg = `Your order ${order.order_number} has been cancelled successfully.\nReason: ${reason}`;
        if (refundStatus === 'Initiated') {
          msg += `\nYour refund of ₹${order.total} has been automatically initiated and will be credited to your original payment method in 5-7 working days.`;
        }
        await WhatsAppService.sendNotification('order_cancelled', cleanPhone, [order.order_number, msg]);
      } catch (e) {
        console.error("Failed to send WhatsApp cancel notif", e);
      }
    }

    // 12. Email Notification
    if (order.user_email) {
      try {
        const { triggerOrderCancelled } = await import('@/lib/services/notifications');
        await triggerOrderCancelled(order, reason, refundStatus === 'Initiated', order.user_email);
      } catch (emailErr) {
        console.error("Failed to send cancel email notification:", emailErr);
      }
    }

    return NextResponse.json({ success: true, status: newStatus, refundStatus });

  } catch (error: any) {
    console.error('Cancellation API Error:', error);
    return NextResponse.json({ error: 'Failed to process cancellation' }, { status: 500 });
  }
}
