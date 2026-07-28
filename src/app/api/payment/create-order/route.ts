import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { supabaseServer as supabase } from '@/lib/supabaseServer';

export async function POST(request: Request) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error("Razorpay API Keys missing in server environment variables.");
      return NextResponse.json({
        error: 'Razorpay Payment Gateway Not Configured',
        details: 'Server environment variables RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET are missing on live server (Vercel). Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Vercel Environment Variables.'
      }, { status: 500 });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const body = await request.json();
    const { orderPayload, orderItems, amount, orderNumber } = body || {};

    let totalPayable = orderPayload?.total;
    if (!totalPayable && amount) {
      totalPayable = Number(amount);
    }

    if (!totalPayable || isNaN(totalPayable) || totalPayable <= 0) {
      return NextResponse.json({ error: 'Valid payable amount is required' }, { status: 400 });
    }

    // 1. Create Razorpay Order
    const rawReceipt = orderPayload?.id ? `rcpt_${orderPayload.id}` : `rcpt_${orderNumber || Date.now()}`;
    const options = {
      amount: Math.round(totalPayable * 100), // amount in paise
      currency: "INR",
      receipt: rawReceipt.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40),
    };

    const rzpOrder = await razorpay.orders.create(options);

    // 2. Try inserting Draft Order into Supabase if payload provided (non-blocking)
    if (orderPayload && orderItems) {
      try {
        const rawAddr = orderPayload.shipping_address || orderPayload.shippingAddress || {};
        const cleanOrderData: any = {
          id: orderPayload.id,
          order_number: orderPayload.order_number || orderNumber || null,
          customer_id: orderPayload.customer_id || null,
          user_name: orderPayload.user_name || orderPayload.userName || rawAddr.name || 'Customer',
          user_phone: orderPayload.user_phone || orderPayload.userPhone || rawAddr.phone || '',
          user_email: orderPayload.user_email || orderPayload.userEmail || '',
          subtotal: Number(orderPayload.subtotal) || totalPayable,
          discount: Number(orderPayload.discount) || 0,
          total: totalPayable,
          delivery_charge: Number(orderPayload.delivery_charge) || 0,
          shipping_address: rawAddr,
          payment_method: 'Razorpay',
          payment_status: 'Pending',
          status: 'Pending',
          source: 'website'
        };

        let { error: orderError } = await supabase.from('orders').upsert([cleanOrderData], { onConflict: 'id' });
        
        if (orderError) {
          console.warn("Draft order upsert failed, retrying with customer_id=null...", orderError.message);
          const cleanPayload = {
            ...cleanOrderData,
            customer_id: null
          };
          const { error: retryError } = await supabase.from('orders').upsert([cleanPayload], { onConflict: 'id' });
          orderError = retryError;
        }

        if (orderError) {
          console.warn("Draft order upsert notice (non-fatal):", orderError.message);
        } else if (orderItems && orderItems.length > 0) {
          const finalOrderItems = orderItems.map((item: any) => ({
            order_id: orderPayload.id,
            product_id: item.product_id || item.productId,
            product_name: item.product_name || item.productName,
            weight: item.weight,
            quantity: Number(item.quantity) || 1,
            price: Number(item.price) || 0,
            image: item.image || ''
          }));
          const { error: itemsError } = await supabase.from('order_items').upsert(finalOrderItems, { onConflict: 'order_id,product_id,weight' });
          if (itemsError) {
            console.warn("Draft order items upsert notice (non-fatal):", itemsError.message);
          }
        }
      } catch (dbErr: any) {
        console.warn("Non-fatal draft order creation exception:", dbErr?.message || dbErr);
      }
    }

    // 3. Return Razorpay Order details to frontend
    return NextResponse.json({
      id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      key_id: keyId
    });
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    const errorDetails = typeof error === 'string'
      ? error
      : error?.message || error?.description || error?.error?.description || (typeof error === 'object' ? JSON.stringify(error) : String(error));

    return NextResponse.json({
      error: 'Failed to create Razorpay order',
      details: errorDetails
    }, { status: 500 });
  }
}
