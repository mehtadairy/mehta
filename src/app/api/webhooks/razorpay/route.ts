import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'fallback_secret_for_local';

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
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
        if (payData) {
          await supabase.from('refunds').insert([{
            order_id: payData.order_id,
            payment_id: refundEntity.payment_id,
            refund_id: refundEntity.id,
            amount: refundEntity.amount / 100,
            status: 'processed'
          }]);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
