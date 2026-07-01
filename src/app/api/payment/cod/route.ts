import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { createInvoice } from '@/lib/services/invoices';

export async function POST(request: Request) {
  try {
    const { orderPayload, orderItems } = await request.json();

    if (!orderPayload || !orderItems || orderItems.length === 0) {
      return NextResponse.json({ success: false, error: 'Missing order details or items' }, { status: 400 });
    }

    const finalOrderData = {
      ...orderPayload,
      payment_id: 'COD-' + Date.now(),
      payment_status: 'Pending',
      status: 'Processing'
    };

    console.log("Inserting COD order to DB:", finalOrderData.order_number);
    let { error: orderError } = await supabase.from('orders').insert([finalOrderData]);
    
    // Self-healing retry: If the 'customer_id' column doesn't exist in the database table schema
    if (orderError && (orderError.message?.includes("customer_id") || orderError.details?.includes("customer_id"))) {
      console.warn("Retrying order insertion without 'customer_id' column...");
      const { customer_id, ...cleanOrderData } = finalOrderData;
      const { error: retryError } = await supabase.from('orders').insert([cleanOrderData]);
      orderError = retryError;
    }
    
    if (orderError) {
      console.error("Failed to insert COD order:", orderError);
      return NextResponse.json({ success: false, error: 'Failed to save order to database: ' + (orderError.message || JSON.stringify(orderError)) }, { status: 500 });
    }

    // Insert Order Items
    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) {
      console.error("Failed to insert COD order items:", itemsError);
    }

    // Insert Payment Log
    const { error: paymentError } = await supabase.from('payments').insert([{
      order_id: finalOrderData.id,
      payment_id: finalOrderData.payment_id,
      razorpay_order_id: null,
      amount: orderPayload.total,
      method: 'COD',
      status: 'pending'
    }]);

    if (paymentError) {
      console.error("Failed to insert COD payment log:", paymentError);
    }

    // 5. Generate Invoice & send email confirmation synchronously (react-pdf is fast enough to not cause 504 timeout)
    try {
      await createInvoice(finalOrderData.id);
    } catch (invoiceErr) {
      console.error("Failed to trigger invoice generation:", invoiceErr);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'COD Order created successfully',
      orderNumber: finalOrderData.order_number,
      paymentId: finalOrderData.payment_id
    });

  } catch (error) {
    console.error('Error creating COD order:', error);
    return NextResponse.json({ success: false, error: 'Failed to process COD order' }, { status: 500 });
  }
}
