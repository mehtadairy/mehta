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

    const newStatus = (isOnlinePayment && isPaid) ? 'Cancellation Requested' : 'Cancelled';
    const refundStatus = (isOnlinePayment && isPaid) ? 'Requested' : 'N/A';

    // 6. Update Order Status
    const primaryPayload: any = {
      status: newStatus,
      payment_status: refundStatus === 'Requested' ? 'Refund Pending' : order.payment_status,
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
      // Fallback update guaranteed to work on any Supabase DB schema
      const minimalRes = await supabase
        .from('orders')
        .update({
          status: newStatus,
          payment_status: refundStatus === 'Requested' ? 'Refund Pending' : order.payment_status
        })
        .eq('id', orderId);

      if (minimalRes.error) {
        console.error("[CancelOrder] Essential order status update failed:", minimalRes.error);
        return NextResponse.json({ error: 'Failed to update order status: ' + minimalRes.error.message }, { status: 500 });
      }
    }

    // Shiprocket cancellation removed.

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
      title: newStatus === 'Cancellation Requested' ? "🟠 Refund Requested" : "🔴 Order Cancelled",
      message: adminMsg,
      type: 'admin',
      order_id: order.id
    }]);

    // 11. WhatsApp Notification
    const cleanPhone = order.user_phone ? `91${order.user_phone.replace(/\D/g, '').slice(-10)}` : '';
    if (cleanPhone) {
      try {
        let msg = `Your order ${order.order_number} has been cancelled successfully.\nReason: ${reason}`;
        if (refundStatus === 'Requested') {
          msg += `\nYour refund request has been received and is being processed. It will be credited to your original payment method in 5-7 working days.`;
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
        await triggerOrderCancelled(order, reason, refundStatus === 'Requested', order.user_email);
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
