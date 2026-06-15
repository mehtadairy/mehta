import { NextResponse } from 'next/server';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { supabase } from '@/lib/supabaseClient';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export async function POST(request: Request) {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      orderPayload,
      orderItems
    } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderPayload) {
      return NextResponse.json({ success: false, error: 'Missing required validation fields' }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || '';

    // 1. Verify Razorpay Signature
    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      console.error("Invalid signature detected for order:", razorpay_order_id);
      return NextResponse.json({ success: false, error: 'Payment signature verification failed' }, { status: 400 });
    }

    // 2. Query Razorpay API to verify the actual paid amount matches the order total
    try {
      const rzpOrder = await razorpay.orders.fetch(razorpay_order_id);
      const expectedAmountPaise = Math.round(orderPayload.total * 100);
      
      if (rzpOrder.amount !== expectedAmountPaise) {
        console.error(`Amount mismatch! Paid: ${rzpOrder.amount} paise, Expected: ${expectedAmountPaise} paise`);
        return NextResponse.json({ success: false, error: 'Paid amount does not match order total' }, { status: 400 });
      }
    } catch (rzpFetchError) {
      console.error("Failed to retrieve order from Razorpay SDK:", rzpFetchError);
      return NextResponse.json({ success: false, error: 'Failed to verify transaction with payment provider' }, { status: 500 });
    }

    // 3. Database Insertion: Create Order
    const finalOrderData = {
      ...orderPayload,
      payment_id: razorpay_payment_id,
      payment_status: 'Paid',
      status: 'Processing'
    };

    console.log("Inserting verified order to DB:", finalOrderData.order_number);
    const { error: orderError } = await supabase.from('orders').insert([finalOrderData]);
    
    if (orderError) {
      console.error("Failed to insert order into Supabase:", orderError);
      return NextResponse.json({ success: false, error: 'Failed to save order to database' }, { status: 500 });
    }

    // 4. Insert Order Items
    if (orderItems && orderItems.length > 0) {
      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) {
        console.error("Failed to insert order items:", itemsError);
        // Note: We log the error but do not fail the whole response since the order was already saved
      }
    }

    // 5. Insert Payment Log
    const { error: paymentError } = await supabase.from('payments').insert([{
      order_id: finalOrderData.id,
      payment_id: razorpay_payment_id,
      razorpay_order_id: razorpay_order_id,
      amount: orderPayload.total,
      method: orderPayload.payment_method || 'Razorpay',
      status: 'paid'
    }]);

    if (paymentError) {
      console.error("Failed to insert payment log:", paymentError);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Payment verified and order created successfully',
      orderNumber: finalOrderData.order_number,
      paymentId: razorpay_payment_id
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ success: false, error: 'Failed to process payment verification' }, { status: 500 });
  }
}
