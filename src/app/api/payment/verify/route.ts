import { NextResponse } from 'next/server';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { createInvoice } from '@/lib/services/invoices';
import { WhatsAppService } from '@/lib/services/whatsapp';
import { verifyCustomerSession } from '@/lib/auth-utils';
import { cookies } from 'next/headers';

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

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderPayload || !orderItems || orderItems.length === 0) {
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

    console.log("Payment signature verified successfully. Waiting for webhook to process order...");

    // Wait for the webhook to update the order with the order_number
    let attempts = 0;
    let foundOrder = null;
    
    // Poll the orders table for up to 10 seconds (10 attempts * 1 second)
    while (attempts < 10) {
      const { data: dbOrder } = await supabase
        .from('orders')
        .select('order_number, payment_status')
        .eq('id', orderPayload.id)
        .maybeSingle();

      if (dbOrder && dbOrder.payment_status === 'Paid' && dbOrder.order_number) {
        foundOrder = dbOrder;
        break;
      }
      
      // Wait 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    if (foundOrder) {
      return NextResponse.json({ 
        success: true, 
        message: 'Payment verified and order created successfully',
        orderNumber: foundOrder.order_number,
        paymentId: razorpay_payment_id
      });
    }

    // Direct fallback insertion/update if Webhook has not processed it yet
    console.log("Webhook delay detected. Finalizing paid order directly in verify endpoint...");
    let generatedOrderNumber = orderPayload.order_number;
    if (!generatedOrderNumber) {
      try {
        const { data: newOrd, error: rpcError } = await supabase.rpc('get_next_order_number');
        if (!rpcError && newOrd) {
          generatedOrderNumber = newOrd;
        }
      } catch (e) {
        console.warn("RPC get_next_order_number unavailable in verify endpoint");
      }

      if (!generatedOrderNumber) {
        const now = new Date();
        const dateStr = now.toISOString().slice(2,10).replace(/-/g, '');
        const randDigits = Math.floor(1000 + Math.random() * 9000);
        generatedOrderNumber = `MD-${dateStr}-${randDigits}`;
      }
    }

    const updatedPayload = {
      ...orderPayload,
      order_number: generatedOrderNumber,
      payment_status: 'Paid',
      status: 'Processing',
      payment_id: razorpay_payment_id,
      paid_at: new Date().toISOString(),
      source: orderPayload.source || 'website'
    };

    const { data: savedOrder, error: saveErr } = await supabase
      .from('orders')
      .upsert([updatedPayload], { onConflict: 'id' })
      .select()
      .single();

    if (saveErr) {
      console.error("Error direct-upserting paid order:", saveErr);
    }

    // Save order items if missing
    if (orderItems && orderItems.length > 0) {
      const itemsToSave = orderItems.map((item: any) => ({
        order_id: orderPayload.id,
        product_id: item.product_id || item.productId,
        product_name: item.product_name || item.productName,
        weight: item.weight,
        quantity: item.quantity,
        price: item.price,
        image: item.image
      }));
      await supabase.from('order_items').upsert(itemsToSave, { onConflict: 'order_id,product_id,weight' });
    }

    // Asynchronously create invoice & dispatch WhatsApp
    try {
      createInvoice(orderPayload.id).catch(e => console.error("Invoice creation warning:", e));
      const cleanPhone = (orderPayload.user_phone || '').replace(/\D/g, '').slice(-10);
      if (cleanPhone) {
        WhatsAppService.sendOrderConfirmation(`91${cleanPhone}`, {
          orderNumber: generatedOrderNumber,
          customerName: orderPayload.user_name || 'Customer',
          totalAmount: orderPayload.total,
          items: orderItems,
          orderId: orderPayload.id
        }).catch(e => console.error("WhatsApp dispatch warning:", e));
      }
    } catch (e) {
      console.warn("Post-verification tasks warning:", e);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Payment verified and order finalized successfully.',
      orderNumber: generatedOrderNumber,
      paymentId: razorpay_payment_id
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ success: false, error: 'Failed to process payment verification' }, { status: 500 });
  }
}
