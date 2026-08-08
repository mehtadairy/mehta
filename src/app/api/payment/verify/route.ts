import { NextResponse } from 'next/server';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { createInvoice } from '@/lib/services/invoices';
import { WhatsAppService } from '@/lib/services/whatsapp';
import { getVerifiedCustomerSession } from '@/lib/auth-utils';
import { generateOrderNumber } from '@/lib/order-utils';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export async function POST(request: Request) {
  const diagnostics: Record<string, string> = {
    endpoint: '/api/payment/verify',
    razorpay_order_id: 'ABSENT',
    razorpay_payment_id: 'ABSENT',
    signature: 'ABSENT',
    order_id: 'ABSENT',
    session: 'ABSENT',
  };

  try {
    // --- 1. Authentication (relaxed — don't reject if expired) ---
    let session: any = null;
    try {
      session = await getVerifiedCustomerSession(request);
    } catch (authErr) {
      console.warn('[PaymentVerify] Session check threw, proceeding with payment verification:', (authErr as any)?.message);
    }
    diagnostics.session = session?.id ? 'PRESENT' : 'ABSENT';

    // --- 2. Parse request body ---
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      orderPayload,
      orderItems
    } = await request.json();

    diagnostics.razorpay_order_id = razorpay_order_id ? 'PRESENT' : 'ABSENT';
    diagnostics.razorpay_payment_id = razorpay_payment_id ? 'PRESENT' : 'ABSENT';
    diagnostics.signature = razorpay_signature ? 'PRESENT' : 'ABSENT';
    diagnostics.order_id = orderPayload?.id || 'ABSENT';

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderPayload || !orderItems || orderItems.length === 0) {
      console.error('[PaymentVerify] Missing required fields:', diagnostics);
      return NextResponse.json({ success: false, error: 'Missing required validation fields', code: 'MISSING_FIELDS' }, { status: 400 });
    }

    // --- 3. Server-Side Price & Quantity Validation ---
    for (const item of orderItems) {
      const qty = Number(item.quantity);
      const prc = Number(item.price);
      if (isNaN(qty) || qty <= 0 || isNaN(prc) || prc < 0) {
        return NextResponse.json({ success: false, error: 'Invalid item quantity or price', code: 'INVALID_ITEMS' }, { status: 400 });
      }
    }

    // --- 4. Verify Razorpay Signature (HMAC-SHA256) ---
    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    if (!secret) {
      console.error('[PaymentVerify] RAZORPAY_KEY_SECRET is missing from environment');
      return NextResponse.json({ success: false, error: 'Payment gateway not configured', code: 'CONFIG_ERROR' }, { status: 500 });
    }

    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      console.error('[PaymentVerify] Signature verification FAILED:', diagnostics);
      return NextResponse.json({ success: false, error: 'Invalid payment signature', code: 'SIGNATURE_FAILED' }, { status: 400 });
    }
    console.log('[PaymentVerify] Signature verification PASSED');

    // --- 5. Idempotency Check: Is this order already paid? ---
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, order_number, payment_status, payment_id, status, customer_id')
      .eq('id', orderPayload.id)
      .maybeSingle();

    if (existingOrder && existingOrder.payment_status === 'Paid') {
      console.log(`[PaymentVerify] Idempotency: Order ${existingOrder.order_number || existingOrder.id} is already Paid. Returning success.`);
      return NextResponse.json({ 
        success: true, 
        message: 'Payment already verified',
        orderNumber: existingOrder.order_number,
        paymentId: existingOrder.payment_id || razorpay_payment_id
      });
    }

    // --- 6. Fetch payment from Razorpay API to validate amount/status ---
    let rzpPayment: any = null;
    try {
      rzpPayment = await razorpay.payments.fetch(razorpay_payment_id);
      console.log(`[PaymentVerify] Razorpay payment fetched: status=${rzpPayment.status}, amount=${rzpPayment.amount}, currency=${rzpPayment.currency}, order_id=${rzpPayment.order_id}`);
    } catch (fetchErr: any) {
      console.error('[PaymentVerify] Failed to fetch payment from Razorpay API:', fetchErr?.message);
      // Don't hard-fail here — signature was valid, so proceed with caution
    }

    // --- 7. Validate payment if we got it from Razorpay ---
    if (rzpPayment) {
      // Check payment status (must be captured or authorized)
      if (rzpPayment.status !== 'captured' && rzpPayment.status !== 'authorized') {
        console.error(`[PaymentVerify] Payment status is "${rzpPayment.status}", not captured/authorized`);
        return NextResponse.json({ 
          success: false, 
          error: `Payment is not completed (status: ${rzpPayment.status}). Please try again or contact support.`,
          code: 'PAYMENT_NOT_CAPTURED'
        }, { status: 400 });
      }

      // Check amount matches (Razorpay amount is in paise)
      const expectedAmountPaise = Math.round(Number(orderPayload.total) * 100);
      if (rzpPayment.amount !== expectedAmountPaise) {
        console.error(`[PaymentVerify] Amount mismatch: expected ${expectedAmountPaise} paise, got ${rzpPayment.amount} paise`);
        return NextResponse.json({ 
          success: false, 
          error: 'Payment amount does not match order total',
          code: 'AMOUNT_MISMATCH'
        }, { status: 400 });
      }

      // Check currency
      if (rzpPayment.currency !== 'INR') {
        console.error(`[PaymentVerify] Currency mismatch: expected INR, got ${rzpPayment.currency}`);
        return NextResponse.json({ 
          success: false, 
          error: 'Payment currency mismatch',
          code: 'CURRENCY_MISMATCH'
        }, { status: 400 });
      }
    }

    // --- 8. Update/Upsert order in database ---
    let generatedOrderNumber = existingOrder?.order_number || orderPayload.order_number;
    if (!generatedOrderNumber) {
      generatedOrderNumber = await generateOrderNumber(supabase);
    }

    const now = new Date().toISOString();
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
      customer_id: session?.id || existingOrder?.customer_id || null,
      source: orderPayload.source || 'website',
      payment_completed_at: now,
    };

    console.log(`[PaymentVerify] Upserting paid order: ${generatedOrderNumber}`);

    let { data: savedOrder, error: saveErr } = await supabase
      .from('orders')
      .upsert([updatedPayload], { onConflict: 'id' })
      .select()
      .single();

    // Schema drift fallback: if payment_completed_at column doesn't exist, retry without it
    if (saveErr && (saveErr.code === '42703' || saveErr.message?.includes('does not exist'))) {
      console.warn('[PaymentVerify] Schema drift detected, retrying without optional columns:', saveErr.message);
      const { payment_completed_at, ...safePayload } = updatedPayload;
      const retryResult = await supabase
        .from('orders')
        .upsert([safePayload], { onConflict: 'id' })
        .select()
        .single();
      saveErr = retryResult.error;
      savedOrder = retryResult.data;
    }

    // FK constraint fallback: retry with customer_id = null
    if (saveErr) {
      console.warn('[PaymentVerify] Upsert failed, retrying with customer_id=null:', saveErr.message);
      const { payment_completed_at, ...cleanPayload } = updatedPayload;
      cleanPayload.customer_id = null;
      const retryResult = await supabase
        .from('orders')
        .upsert([cleanPayload], { onConflict: 'id' })
        .select()
        .single();
      saveErr = retryResult.error;
      savedOrder = retryResult.data;
    }

    if (saveErr || !savedOrder) {
      console.error('[PaymentVerify] CRITICAL: Failed to save paid order:', saveErr);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to save order to database. Your payment was successful — please contact support with your payment ID.',
        code: 'DB_SAVE_FAILED',
        paymentId: razorpay_payment_id
      }, { status: 500 });
    }

    console.log(`[PaymentVerify] Order saved successfully: ${generatedOrderNumber}, payment_status=Paid`);

    // --- 9. Save order items (idempotent) ---
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
      await supabase.from('order_items').delete().eq('order_id', orderPayload.id);
      const { error: itemsError } = await supabase.from('order_items').insert(itemsToSave);
      if (itemsError) {
        console.error('[PaymentVerify] Warning: Failed to insert order items:', itemsError.message);
      }
    }

    // --- 10. Post-verification tasks (non-blocking) ---
    try {
      createInvoice(orderPayload.id).catch(e => console.error('[PaymentVerify] Invoice warning:', e));

      const { PrintingService } = await import('@/lib/services/printing');
      const branchId = (orderPayload.shipping_address as any)?.branch_id || 'Main';
      const fullOrderForPrint = { ...savedOrder, items: orderItems };
      PrintingService.queueOrderPrints(fullOrderForPrint, branchId).catch(e => console.error('[PaymentVerify] Print queue warning:', e));

      const cleanPhone = (orderPayload.user_phone || '').replace(/\D/g, '').slice(-10);
      if (cleanPhone) {
        WhatsAppService.sendOrderConfirmation(`91${cleanPhone}`, {
          orderNumber: generatedOrderNumber,
          customerName: orderPayload.user_name || 'Customer',
          totalAmount: orderPayload.total,
          items: orderItems,
          orderId: orderPayload.id
        }).catch(e => console.error('[PaymentVerify] WhatsApp warning:', e));
      }
    } catch (e) {
      console.warn('[PaymentVerify] Post-verification tasks warning:', e);
    }

    // --- 11. Return success ---
    return NextResponse.json({ 
      success: true, 
      message: 'Payment verified and order finalized successfully.',
      orderNumber: generatedOrderNumber,
      paymentId: razorpay_payment_id
    });

  } catch (error: any) {
    console.error('[PaymentVerify] Uncaught error:', error?.message || error, diagnostics);
    return NextResponse.json({ 
      success: false, 
      error: 'Payment verification encountered a server error. If your payment was deducted, please check your order history before trying again.',
      code: 'SERVER_ERROR'
    }, { status: 500 });
  }
}
