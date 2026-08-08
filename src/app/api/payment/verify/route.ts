import { NextResponse } from 'next/server';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { createInvoice } from '@/lib/services/invoices';
import { WhatsAppService } from '@/lib/services/whatsapp';
import { verifyCustomerSession, getVerifiedCustomerSession } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { generateOrderNumber } from '@/lib/order-utils';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export async function POST(request: Request) {
  try {
    const session = await getVerifiedCustomerSession(request);
    if (!session || !session.id) {
      return NextResponse.json({ success: false, error: 'Authentication Required. Please log in to complete checkout.' }, { status: 401 });
    }

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

    // 🔒 Server-Side Price & Quantity Validation
    for (const item of orderItems) {
      const qty = Number(item.quantity);
      const prc = Number(item.price);
      if (isNaN(qty) || qty <= 0 || isNaN(prc) || prc < 0) {
        return NextResponse.json({ success: false, error: 'Invalid item quantity or price' }, { status: 400 });
      }
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
      generatedOrderNumber = await generateOrderNumber(supabase);
    }

    const updatedPayload: any = {
      id: orderPayload.id,
      order_number: generatedOrderNumber,
      payment_status: 'Paid',
      status: 'Processing',
      payment_id: razorpay_payment_id,
      payment_method: orderPayload.payment_method || 'Razorpay',
      subtotal: Number(orderPayload.subtotal),
      discount: Number(orderPayload.discount) || 0,
      total: Number(orderPayload.total),
      delivery_charge: Number(orderPayload.delivery_charge) || 0,
      shipping_address: orderPayload.shipping_address || {},
      user_name: orderPayload.user_name || orderPayload.userName || '',
      user_phone: orderPayload.user_phone || orderPayload.userPhone || '',
      user_email: orderPayload.user_email || orderPayload.userEmail || '',
      coupon_code: orderPayload.coupon_code || null,
      customer_id: session.id,
      source: orderPayload.source || 'website'
    };

    console.log("Upserting paid order fallback in verify route:", updatedPayload.order_number);
    let { data: savedOrder, error: saveErr } = await supabase
      .from('orders')
      .upsert([updatedPayload], { onConflict: 'id' })
      .select()
      .single();

    // Self-healing retry: If customer_id FK violation or other DB constraint failure occurs
    if (saveErr) {
      console.warn("Direct upsert of paid order failed, retrying with customer_id set to null...", saveErr.message);
      const cleanPayload = {
        ...updatedPayload,
        customer_id: null // Bypass FK/RLS constraints
      };
      const { data: retryData, error: retryError } = await supabase
        .from('orders')
        .upsert([cleanPayload], { onConflict: 'id' })
        .select()
        .single();
      
      saveErr = retryError;
      if (retryData) savedOrder = retryData;
    }

    if (saveErr || !savedOrder) {
      console.error("Critical error saving paid order in verification endpoint:", saveErr);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to save paid order in database: ' + (saveErr?.message || 'Unknown') 
      }, { status: 500 });
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
      // Delete any existing items for idempotency, then insert
      await supabase.from('order_items').delete().eq('order_id', orderPayload.id);
      const { error: itemsError } = await supabase.from('order_items').insert(itemsToSave);
      if (itemsError) {
        console.error("Failed to insert verified order items:", itemsError);
      }
    }

    // Asynchronously create invoice, dispatch WhatsApp & queue POS print
    try {
      createInvoice(orderPayload.id).catch(e => console.error("Invoice creation warning:", e));

      const { PrintingService } = await import('@/lib/services/printing');
      const branchId = (orderPayload.shipping_address as any)?.branch_id || 'Main';
      const fullOrderForPrint = { ...savedOrder, items: orderItems };
      PrintingService.queueOrderPrints(fullOrderForPrint, branchId).catch(e => console.error("Printing queue warning:", e));

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
