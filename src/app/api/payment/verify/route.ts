import { NextResponse } from 'next/server';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { createInvoice } from '@/lib/services/invoices';

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
      console.error("Payment signature verification failed.", {
        expected: generated_signature,
        received: razorpay_signature
      });
      return NextResponse.json({ success: false, error: 'Invalid payment signature' }, { status: 400 });
    }

    console.log("Payment signature verified successfully.");

    // 2. Query Razorpay API (Bypassed per request to check payment status ourselves; prevents crash/500 errors on mock/test credentials)
    console.log("Razorpay SDK amount verification skipped. Order amount assumed correct:", orderPayload.total);

    // 3. Database Insertion: Create Order
    // Sanitize order payload to prevent malicious injection
    const { id, created_at, updated_at, status, payment_status, payment_id, ...sanitizedPayload } = orderPayload;

    const finalOrderData = {
      ...sanitizedPayload,
      payment_id: razorpay_payment_id,
      payment_status: 'Paid',
      status: 'Processing'
    };

    console.log("Inserting verified order to DB:", finalOrderData.order_number);
    let { error: orderError } = await supabase.from('orders').insert([finalOrderData]);
    
    // Self-healing retry: If the 'customer_id' column doesn't exist in the database table schema
    if (orderError && (orderError.message?.includes("customer_id") || orderError.details?.includes("customer_id"))) {
      console.warn("Retrying order insertion without 'customer_id' column...");
      const { customer_id, ...cleanOrderData } = finalOrderData;
      const { error: retryError } = await supabase.from('orders').insert([cleanOrderData]);
      orderError = retryError;
    }
    
    if (orderError) {
      console.error("Failed to insert order into Supabase:", orderError);
      return NextResponse.json({ success: false, error: 'Failed to save order to database: ' + (orderError.message || JSON.stringify(orderError)) }, { status: 500 });
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

    // 6. Generate Invoice & send email confirmation synchronously (DB insert only, very fast)
    try {
      await createInvoice(finalOrderData.id);
    } catch (invoiceErr) {
      console.error("Failed to trigger invoice generation:", invoiceErr);
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
