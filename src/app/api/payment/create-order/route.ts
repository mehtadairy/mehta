import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { supabase } from '@/lib/supabaseClient';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export async function POST(request: Request) {
  try {
    const { amount, orderPayload, orderItems } = await request.json();

    if (!amount || !orderPayload) {
      return NextResponse.json({ error: 'Amount and Order Details are required' }, { status: 400 });
    }

    // 1. Create Razorpay Order
    const options = {
      amount: Math.round(amount * 100), // amount in smallest currency unit (paise)
      currency: "INR",
      receipt: `receipt_${orderPayload.order_number}`,
    };

    const rzpOrder = await razorpay.orders.create(options);

    // 2. Add Razorpay Order ID to the Supabase order payload
    const finalOrderData = {
      ...orderPayload,
      payment_id: rzpOrder.id, // we store the rzp_order_id in payment_id column initially
      status: 'Pending',
      payment_status: 'Pending'
    };

    // 3. Store Order in Database securely before payment
    const { error: orderError } = await supabase.from('orders').insert([finalOrderData]);
    
    if (orderError) {
      console.error("Failed to save order to DB:", orderError);
      return NextResponse.json({ error: 'Failed to log pending order' }, { status: 500 });
    }

    // 4. Store Order Items
    if (orderItems && orderItems.length > 0) {
      await supabase.from('order_items').insert(orderItems);
    }

    // 5. Store Payment Log
    await supabase.from('payments').insert([{
      order_id: finalOrderData.id,
      razorpay_order_id: rzpOrder.id,
      amount: amount,
      method: finalOrderData.payment_method,
      status: 'pending'
    }]);

    return NextResponse.json(rzpOrder);
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
