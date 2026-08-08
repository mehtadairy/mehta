import { NextResponse } from 'next/server';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { createInvoice } from '@/lib/services/invoices';
import { WhatsAppService } from '@/lib/services/whatsapp';
import { getVerifiedCustomerSession } from '@/lib/auth-utils';

// ─── Razorpay client initialised once at module level ────────────────────────
const rzpKeyId = process.env.RAZORPAY_KEY_ID || '';
const rzpKeySecret = process.env.RAZORPAY_KEY_SECRET || '';

const razorpay = new Razorpay({
  key_id: rzpKeyId,
  key_secret: rzpKeySecret,
});

// Determine key mode for diagnostics only — never log actual values
const keyMode = rzpKeyId.startsWith('rzp_live_') ? 'LIVE' : (rzpKeyId.startsWith('rzp_test_') ? 'TEST' : 'UNKNOWN');

/**
 * Generate an order number using the correct RPC function name.
 * We strictly do NOT fallback to timestamp-based numbers.
 */
async function generateOrderNumber(): Promise<string> {
  const { data, error } = await supabase.rpc('get_next_order_number');
  if (!error && data) {
    console.log(`[PaymentVerify] Order number generated via get_next_order_number: ${data}`);
    return data;
  }
  
  console.error('[PaymentVerify] get_next_order_number RPC error:', { code: error?.code, message: error?.message });
  throw new Error("Failed to generate order number from database sequence.");
}

export async function POST(request: Request) {
  const step = { current: 'INIT' };

  try {
    // ── STEP 1: Environment check ─────────────────────────────────────────
    step.current = 'ENV_CHECK';
    console.log(`[PaymentVerify] ENV: key_mode=${keyMode}, key_id_present=${!!rzpKeyId}, secret_present=${!!rzpKeySecret}`);

    if (!rzpKeySecret) {
      console.error('[PaymentVerify] ENV FAILED: RAZORPAY_KEY_SECRET not set');
      return NextResponse.json({ success: false, error: 'Payment gateway not configured', code: 'CONFIG_ERROR' }, { status: 500 });
    }

    // ── STEP 2: Parse request body ────────────────────────────────────────
    step.current = 'PARSE_BODY';
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderPayload, orderItems } = body;

    const fieldFlags = {
      razorpay_order_id_present: !!razorpay_order_id,
      razorpay_payment_id_present: !!razorpay_payment_id,
      signature_present: !!razorpay_signature,
      order_payload_present: !!orderPayload,
      order_id_present: !!orderPayload?.id,
      order_total_present: !!orderPayload?.total,
      order_items_count: Array.isArray(orderItems) ? orderItems.length : 0,
    };
    console.log('[PaymentVerify] Request received:', JSON.stringify(fieldFlags));

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderPayload?.id || !orderPayload?.total || !Array.isArray(orderItems) || orderItems.length === 0) {
      console.error('[PaymentVerify] PARSE_BODY FAILED: Missing required fields', fieldFlags);
      return NextResponse.json({ success: false, error: 'Missing required fields', code: 'MISSING_FIELDS' }, { status: 400 });
    }

    // ── STEP 3: Authentication (relaxed — payment already captured) ───────
    step.current = 'AUTH';
    let session: any = null;
    try {
      session = await getVerifiedCustomerSession(request);
      console.log(`[PaymentVerify] Authentication: ${session?.id ? 'SUCCESS' : 'NO_SESSION (proceeding anyway)'}`);
    } catch (authErr: any) {
      console.warn('[PaymentVerify] Authentication: threw exception (proceeding anyway):', authErr?.message);
    }

    // ── STEP 4: Item price & quantity validation ───────────────────────────
    step.current = 'ITEM_VALIDATION';
    for (const item of orderItems) {
      const qty = Number(item.quantity);
      const prc = Number(item.price);
      if (isNaN(qty) || qty <= 0 || isNaN(prc) || prc < 0) {
        console.error('[PaymentVerify] ITEM_VALIDATION FAILED: invalid qty or price', { qty, prc });
        return NextResponse.json({ success: false, error: 'Invalid item quantity or price', code: 'INVALID_ITEMS' }, { status: 400 });
      }
    }

    // ── STEP 5: HMAC-SHA256 signature verification ────────────────────────
    step.current = 'SIGNATURE';
    const generated_signature = crypto
      .createHmac('sha256', rzpKeySecret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      console.error('[PaymentVerify] Razorpay signature: FAILED (mismatch)');
      return NextResponse.json({ success: false, error: 'Invalid payment signature', code: 'SIGNATURE_FAILED' }, { status: 400 });
    }
    console.log('[PaymentVerify] Razorpay signature: SUCCESS');

    // ── STEP 6: Idempotency — check if already paid ───────────────────────
    step.current = 'IDEMPOTENCY';
    const { data: existingOrder, error: lookupErr } = await supabase
      .from('orders')
      .select('id, order_number, payment_status, payment_id, status, customer_id, total')
      .eq('id', orderPayload.id)
      .maybeSingle();

    if (lookupErr) {
      console.error('[PaymentVerify] Order lookup: FAILED', { code: lookupErr.code, message: lookupErr.message });
      return NextResponse.json({ success: false, error: 'Failed to look up order', code: 'DB_LOOKUP_ERROR' }, { status: 500 });
    }
    console.log(`[PaymentVerify] Order lookup: ${existingOrder ? 'SUCCESS' : 'NOT_FOUND'}, payment_status=${existingOrder?.payment_status || 'N/A'}`);

    if (existingOrder?.payment_status === 'Paid') {
      console.log(`[PaymentVerify] Idempotency: already Paid. Returning success.`);
      return NextResponse.json({
        success: true,
        message: 'Payment already verified',
        orderNumber: existingOrder.order_number,
        paymentId: existingOrder.payment_id || razorpay_payment_id,
      });
    }

    // ── STEP 7: Fetch payment from Razorpay API ───────────────────────────
    step.current = 'RAZORPAY_API';
    let rzpPayment: any = null;
    try {
      rzpPayment = await razorpay.payments.fetch(razorpay_payment_id);
      console.log(`[PaymentVerify] Razorpay API: SUCCESS — status=${rzpPayment.status}, amount=${rzpPayment.amount}, currency=${rzpPayment.currency}, rzp_order_id=${rzpPayment.order_id}`);
    } catch (fetchErr: any) {
      console.error('[PaymentVerify] Razorpay API: FAILED (proceeding on valid signature):', fetchErr?.message);
    }

    // ── STEP 8: Payment validation ────────────────────────────────────────
    step.current = 'PAYMENT_VALIDATION';
    if (rzpPayment) {
      if (rzpPayment.status !== 'captured' && rzpPayment.status !== 'authorized') {
        console.error(`[PaymentVerify] Amount validation: FAILED — payment status "${rzpPayment.status}" is not captured/authorized`);
        return NextResponse.json({
          success: false,
          error: `Payment not completed (status: ${rzpPayment.status})`,
          code: 'PAYMENT_NOT_CAPTURED',
        }, { status: 400 });
      }

      // Use database total as authoritative amount — never trust browser value
      const authoritativeTotal = existingOrder?.total ?? Number(orderPayload.total);
      const expectedPaise = Math.round(Number(authoritativeTotal) * 100);
      if (rzpPayment.amount !== expectedPaise) {
        console.error(`[PaymentVerify] Amount validation: FAILED — expected=${expectedPaise} paise, got=${rzpPayment.amount} paise`);
        return NextResponse.json({
          success: false,
          error: 'Payment amount does not match order total',
          code: 'AMOUNT_MISMATCH',
        }, { status: 400 });
      }

      if (rzpPayment.currency !== 'INR') {
        console.error(`[PaymentVerify] Amount validation: FAILED — currency mismatch: ${rzpPayment.currency}`);
        return NextResponse.json({ success: false, error: 'Payment currency mismatch', code: 'CURRENCY_MISMATCH' }, { status: 400 });
      }

      console.log('[PaymentVerify] Amount validation: SUCCESS');
    }

    // ── STEP 9: Generate order number ─────────────────────────────────────
    step.current = 'ORDER_NUMBER';
    let generatedOrderNumber = existingOrder?.order_number || orderPayload.order_number;
    if (!generatedOrderNumber) {
      generatedOrderNumber = await generateOrderNumber();
    }
    console.log(`[PaymentVerify] Order number resolved: ${generatedOrderNumber}`);

    // ── STEP 10: Database update ──────────────────────────────────────────
    step.current = 'DB_UPDATE';
    const now = new Date().toISOString();

    // Build the update payload — only confirmed-existing columns
    const baseUpdate: Record<string, any> = {
      order_number: generatedOrderNumber,
      payment_status: 'Paid',
      status: 'Processing',
      payment_id: razorpay_payment_id,
      payment_method: orderPayload.payment_method || 'Razorpay',
    };

    // Attempt 1: Full UPDATE on existing row (preferred — avoids upsert overwriting required FK columns)
    let { error: updateErr } = await supabase
      .from('orders')
      .update({ ...baseUpdate, payment_completed_at: now })
      .eq('id', orderPayload.id);

    if (updateErr && (updateErr.code === '42703' || updateErr.message?.includes('does not exist'))) {
      console.warn('[PaymentVerify] Database update: column missing, retrying without payment_completed_at:', updateErr.message);
      const retry = await supabase.from('orders').update(baseUpdate).eq('id', orderPayload.id);
      updateErr = retry.error;
    }

    if (updateErr) {
      // If order doesn't exist yet (Draft was never saved), do a full upsert
      console.warn('[PaymentVerify] Database update: UPDATE failed, attempting upsert:', { code: updateErr.code, message: updateErr.message });
      const upsertPayload: any = {
        id: orderPayload.id,
        ...baseUpdate,
        subtotal: Number(orderPayload.subtotal) || Number(orderPayload.total),
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
      };

      const { error: upsertErr } = await supabase.from('orders').upsert([upsertPayload], { onConflict: 'id' });

      if (upsertErr) {
        console.error('[PaymentVerify] Database update: FAILED (all attempts):', { code: upsertErr.code, message: upsertErr.message, details: upsertErr.details, hint: upsertErr.hint });
        return NextResponse.json({
          success: false,
          error: 'Failed to record payment in database. Your payment was successful — please contact support with your payment ID.',
          code: 'DB_UPDATE_FAILED',
          paymentId: razorpay_payment_id,
        }, { status: 500 });
      }
    }

    console.log(`[PaymentVerify] Database update: SUCCESS — order ${generatedOrderNumber} marked Paid`);

    // ── STEP 11: Save order items (idempotent delete+insert) ─────────────
    step.current = 'ORDER_ITEMS';
    if (orderItems.length > 0) {
      const itemsToSave = orderItems.map((item: any) => ({
        order_id: orderPayload.id,
        product_id: item.product_id || item.productId,
        product_name: item.product_name || item.productName,
        weight: item.weight,
        quantity: item.quantity,
        price: item.price,
        image: item.image || null,
      }));
      await supabase.from('order_items').delete().eq('order_id', orderPayload.id);
      const { error: itemsErr } = await supabase.from('order_items').insert(itemsToSave);
      if (itemsErr) {
        console.error('[PaymentVerify] Order items insert warning:', { code: itemsErr.code, message: itemsErr.message });
      } else {
        console.log(`[PaymentVerify] Order items: ${itemsToSave.length} item(s) saved`);
      }
    }

    // ── STEP 12: Post-success tasks (non-blocking, errors don't affect response) ──
    step.current = 'POST_SUCCESS';
    try {
      // Invoice
      createInvoice(orderPayload.id).catch(e => console.error('[PaymentVerify] Invoice warning:', e?.message));

      // Print queue
      import('@/lib/services/printing').then(({ PrintingService }) => {
        const branchId = (orderPayload.shipping_address as any)?.branch_id || 'Main';
        const { data: fullOrder } = {} as any; // fetch is synchronous only — print will use saved data
        PrintingService.queueOrderPrints({ id: orderPayload.id, order_number: generatedOrderNumber, ...orderPayload, order_items: orderItems }, branchId)
          .catch(e => console.error('[PaymentVerify] Print queue warning:', e?.message));
      }).catch(e => console.error('[PaymentVerify] Print import warning:', e?.message));

      // WhatsApp — use correct signature: (phone: string, orderId: string, amount: number)
      const cleanPhone = String(orderPayload.user_phone || '').replace(/\D/g, '').slice(-10);
      if (cleanPhone.length === 10) {
        WhatsAppService.sendOrderConfirmation(
          `91${cleanPhone}`,
          generatedOrderNumber,
          Number(orderPayload.total)
        ).catch(e => console.error('[PaymentVerify] WhatsApp warning:', e?.message));
      }
    } catch (postErr: any) {
      console.warn('[PaymentVerify] Post-success tasks warning:', postErr?.message);
    }

    // ── STEP 13: Return success ───────────────────────────────────────────
    console.log(`[PaymentVerify] COMPLETE: order ${generatedOrderNumber}, payment_id=${razorpay_payment_id}`);
    return NextResponse.json({
      success: true,
      message: 'Payment verified and order confirmed.',
      orderNumber: generatedOrderNumber,
      paymentId: razorpay_payment_id,
    });

  } catch (error: any) {
    console.error(`[PaymentVerify] UNCAUGHT EXCEPTION at step "${step.current}":`, {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      supabaseCode: error?.code,
      supabaseHint: error?.hint,
      supabaseDetails: error?.details,
    });
    return NextResponse.json({
      success: false,
      error: 'Payment verification encountered a server error. If your payment was deducted, please check your order history before trying again.',
      code: 'SERVER_ERROR',
    }, { status: 500 });
  }
}
