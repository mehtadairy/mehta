import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();

    const secret = process.env.RAZORPAY_KEY_SECRET || '';

    // Create the expected signature
    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');

    // Compare signatures
    if (generated_signature === razorpay_signature) {
      
      // Update Payment Log
      await supabase.from('payments').update({
        payment_id: razorpay_payment_id,
        status: 'paid'
      }).eq('razorpay_order_id', razorpay_order_id);

      // Fetch the internal order_id using razorpay_order_id stored in payments
      const { data: payData } = await supabase.from('payments').select('order_id').eq('razorpay_order_id', razorpay_order_id).single();

      if (payData && payData.order_id) {
        // Update Order
        await supabase.from('orders').update({
          payment_status: 'Paid',
          payment_id: razorpay_payment_id
        }).eq('id', payData.order_id);
      }

      // Payment is successful and verified
      return NextResponse.json({ success: true, message: 'Payment verified successfully' });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ success: false, error: 'Failed to verify payment' }, { status: 500 });
  }
}
