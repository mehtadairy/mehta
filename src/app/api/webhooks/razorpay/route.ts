import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseServer as supabase } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature || !secret) {
      console.warn("Razorpay webhook secret or signature missing.");
      return NextResponse.json({ error: 'Unauthorized: Missing secret/signature' }, { status: 401 });
    }

    // Verify Webhook Signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.warn("Invalid webhook signature received");
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const paymentEntity = payload.payload.payment?.entity;
    
    if (!paymentEntity) {
      return NextResponse.json({ success: true, message: 'Unhandled event lacking payment entity' });
    }

    const razorpay_order_id = paymentEntity.order_id;
    const razorpay_payment_id = paymentEntity.id;

    if (event === 'payment.captured' || event === 'payment.authorized') {
      // Mark as paid
      await supabase.from('payments').update({
        payment_id: razorpay_payment_id,
        status: 'paid'
      }).eq('razorpay_order_id', razorpay_order_id);

      const { data: payData } = await supabase.from('payments').select('order_id').eq('razorpay_order_id', razorpay_order_id).single();
      if (payData && payData.order_id) {
        await supabase.from('orders').update({ payment_status: 'Paid', payment_id: razorpay_payment_id }).eq('id', payData.order_id);
        
        // Fetch full order to queue print jobs
        const { data: orderDetails } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('id', payData.order_id)
          .single();
          
        if (orderDetails) {
          // Dynamic import to avoid edge runtime issues if PrintingService uses node APIs
          const { PrintingService } = await import('@/lib/services/printing');
          
          // Determine branch from order if available, else default to 'Main'
          const branchId = (orderDetails.shipping_address as any)?.branch_id || 'Main';
          
          await PrintingService.queueOrderPrints(orderDetails, branchId);
        }
      }
    } 
    else if (event === 'payment.failed') {
      // Mark as failed
      await supabase.from('payments').update({
        payment_id: razorpay_payment_id,
        status: 'failed'
      }).eq('razorpay_order_id', razorpay_order_id);

      const { data: payData } = await supabase.from('payments').select('order_id').eq('razorpay_order_id', razorpay_order_id).single();
      if (payData && payData.order_id) {
        await supabase.from('orders').update({ payment_status: 'Failed', payment_id: razorpay_payment_id }).eq('id', payData.order_id);
      }
    }
    else if (event === 'refund.processed' || event === 'refund.created') {
      const refundEntity = payload.payload.refund?.entity;
      if (refundEntity) {
        const { data: payData } = await supabase.from('payments').select('order_id').eq('payment_id', refundEntity.payment_id).single();
        if (payData && payData.order_id) {
          // Insert into refunds table
          await supabase.from('refunds').insert([{
            order_id: payData.order_id,
            payment_id: refundEntity.payment_id,
            refund_id: refundEntity.id,
            amount: refundEntity.amount / 100,
            status: 'processed'
          }]);

          // Fetch full order details for notifications
          const { data: order } = await supabase.from('orders').select('*').eq('id', payData.order_id).single();
          if (order) {
            // Update order and cancellation status
            await supabase.from('orders').update({
              status: 'Cancelled',
              payment_status: 'Refund Completed'
            }).eq('id', order.id);

            await supabase.from('order_cancellations').update({
              refund_status: 'Completed'
            }).eq('order_id', order.id);

            // WhatsApp Notification
            const cleanPhone = order.user_phone ? `91${order.user_phone.replace(/\D/g, '').slice(-10)}` : '';
            if (cleanPhone) {
              const { WhatsAppService } = await import('@/lib/services/whatsapp');
              try {
                await WhatsAppService.sendNotification('refund_completed', cleanPhone, [order.order_number, order.total.toString()]);
              } catch (e) {
                console.error("Failed to send WhatsApp refund complete notification:", e);
              }
            }

            // Email Notification
            if (order.user_email) {
              try {
                const { triggerRefundProcessed } = await import('@/lib/services/notifications');
                await triggerRefundProcessed(order, order.user_email);
              } catch (e) {
                console.error("Failed to send Email refund complete notification:", e);
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
