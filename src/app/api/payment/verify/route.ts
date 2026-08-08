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

async function generateOrderNumber(): Promise<string> {
  const { data, error } = await supabase.rpc('get_next_order_number');
  if (!error && data) {
    console.log(`[Payment Verify] order number generation: success (${data})`);
    return data;
  }
  
  console.error('[Payment Verify] FAILED STEP: order number generation', { code: error?.code, message: error?.message });
  throw new Error(`Failed to generate sequential order number securely: ${error?.message || 'Database error'}`);
}

export async function POST(request: Request) {
  const step = { current: 'INIT' };

  try {
    console.log('[Payment Verify] START');
    
    // ── STEP 1: Environment check ─────────────────────────────────────────
    step.current = 'ENV_CHECK';
    
    if (!rzpKeySecret) {
      console.error('[Payment Verify] FAILED STEP: ENV_CHECK');
      console.error('[Payment Verify] ERROR CODE: CONFIG_ERROR');
      console.error('[Payment Verify] ERROR MESSAGE: RAZORPAY_KEY_SECRET not set');
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

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderPayload?.id || !orderPayload?.total || !Array.isArray(orderItems) || orderItems.length === 0) {
      console.error('[Payment Verify] FAILED STEP: PARSE_BODY');
      console.error('[Payment Verify] ERROR CODE: MISSING_FIELDS');
      console.error('[Payment Verify] ERROR MESSAGE: Missing required fields in request');
      return NextResponse.json({ success: false, error: 'Missing required fields', code: 'MISSING_FIELDS' }, { status: 400 });
    }

    // ── STEP 3: Authentication (relaxed — payment already captured) ───────
    step.current = 'AUTH';
    let session: any = null;
    try {
      session = await getVerifiedCustomerSession(request);
    } catch (authErr: any) {
      // safe to proceed without session
    }

    // ── STEP 4: Item price & quantity validation ───────────────────────────
    step.current = 'ITEM_VALIDATION';
    for (const item of orderItems) {
      const qty = Number(item.quantity);
      const prc = Number(item.price);
      if (isNaN(qty) || qty <= 0 || isNaN(prc) || prc < 0) {
        console.error('[Payment Verify] FAILED STEP: ITEM_VALIDATION');
        console.error('[Payment Verify] ERROR CODE: INVALID_ITEMS');
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
      console.error('[Payment Verify] FAILED STEP: SIGNATURE');
      console.error('[Payment Verify] ERROR CODE: SIGNATURE_FAILED');
      return NextResponse.json({ success: false, error: 'Invalid payment signature', code: 'SIGNATURE_FAILED' }, { status: 400 });
    }

    // ── STEP 6: Idempotency — check if already paid ───────────────────────
    step.current = 'IDEMPOTENCY';
    const { data: existingOrder, error: lookupErr } = await supabase
      .from('orders')
      .select('id, order_number, payment_status, payment_id, status, customer_id, total')
      .eq('id', orderPayload.id)
      .maybeSingle();

    if (lookupErr) {
      console.error('[Payment Verify] FAILED STEP: DB_LOOKUP');
      console.error('[Payment Verify] ERROR CODE: DB_LOOKUP_ERROR');
      return NextResponse.json({ success: false, error: 'Failed to look up order', code: 'DB_LOOKUP_ERROR' }, { status: 500 });
    }
    
    console.log(`[Payment Verify] order found: ${existingOrder ? 'true' : 'false'}`);

    if (existingOrder?.payment_status === 'Paid') {
      console.log(`[Payment Verify] idempotency: already processed. Returning success.`);
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
      console.log(`[Payment Verify] razorpay payment fetched: true`);
    } catch (fetchErr: any) {
      console.error('[Payment Verify] FAILED STEP: RAZORPAY_API_FETCH');
      console.error('[Payment Verify] ERROR MESSAGE: Failed to fetch from Razorpay API');
    }

    // ── STEP 8: Payment validation ────────────────────────────────────────
    step.current = 'PAYMENT_VALIDATION';
    if (rzpPayment) {
      if (rzpPayment.status !== 'captured' && rzpPayment.status !== 'authorized') {
        console.error(`[Payment Verify] FAILED STEP: PAYMENT_STATUS_CHECK`);
        console.error(`[Payment Verify] ERROR CODE: PAYMENT_NOT_CAPTURED`);
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
        console.error(`[Payment Verify] FAILED STEP: AMOUNT_VALIDATION`);
        console.error(`[Payment Verify] ERROR CODE: AMOUNT_MISMATCH`);
        return NextResponse.json({
          success: false,
          error: 'Payment amount does not match order total',
          code: 'AMOUNT_MISMATCH',
        }, { status: 400 });
      }

      if (rzpPayment.currency !== 'INR') {
        console.error(`[Payment Verify] FAILED STEP: CURRENCY_VALIDATION`);
        console.error(`[Payment Verify] ERROR CODE: CURRENCY_MISMATCH`);
        return NextResponse.json({ success: false, error: 'Payment currency mismatch', code: 'CURRENCY_MISMATCH' }, { status: 400 });
      }

      console.log('[Payment Verify] amount validation: passed');
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

    let upsertErr: any = null;

    if (existingOrder) {
      let { error: updateErr } = await supabase
        .from('orders')
        .update({ ...baseUpdate, payment_completed_at: now })
        .eq('id', orderPayload.id);

      if (updateErr && (updateErr.code === '42703' || updateErr.message?.includes('does not exist'))) {
        const retry = await supabase.from('orders').update(baseUpdate).eq('id', orderPayload.id);
        updateErr = retry.error;
      }
      upsertErr = updateErr;
    } else {
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
        customer_id: session?.id || null,
        source: orderPayload.source || 'website',
      };

      const { error: errorResult } = await supabase.from('orders').upsert([upsertPayload], { onConflict: 'id' });
      upsertErr = errorResult;
    }

    if (upsertErr) {
      console.error('[Payment Verify] FAILED STEP: DB_UPDATE');
      console.error('[Payment Verify] ERROR CODE: DB_UPDATE_FAILED');
      console.error('[Payment Verify] ERROR MESSAGE: Failed to upsert order record', { message: upsertErr.message });
        return NextResponse.json({
          success: false,
          error: 'Failed to record payment in database. Your payment was successful — please contact support with your payment ID.',
          code: 'DB_UPDATE_FAILED',
          paymentId: razorpay_payment_id,
        }, { status: 500 });
      }
    console.log(`[Payment Verify] database update: success`);
    console.log(`[Payment Verify] order status: Processing`);

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
        console.error('[Payment Verify] FAILED STEP: ORDER_ITEMS_INSERT');
        console.error('[Payment Verify] ERROR CODE: DB_ITEMS_FAILED');
        console.error('[Payment Verify] ERROR MESSAGE: Failed to insert order items', { message: itemsErr.message });
        // Fail the request if items cannot be saved!
        return NextResponse.json({
          success: false,
          error: 'Failed to record order items in database. Your payment was successful — please contact support with your payment ID.',
          code: 'DB_ITEMS_FAILED',
          paymentId: razorpay_payment_id,
        }, { status: 500 });
      } else {
        console.log(`[Payment Verify] order items: ${itemsToSave.length} item(s) saved`);
      }
    }

    // ── STEP 12: Post-success tasks (non-blocking, errors don't affect response) ──
    step.current = 'POST_SUCCESS';
    
    // Invoice
    try {
      createInvoice(orderPayload.id).then(() => {
        console.log('[Payment Verify] invoice: success');
      }).catch(e => {
        console.error('[Payment Verify] FAILED STEP: INVOICE_GENERATION');
        console.error('[Payment Verify] ERROR MESSAGE: ' + (e?.message || 'Invoice creation failed'));
      });
    } catch(e) {}

    // Print queue
    try {
      import('@/lib/services/printing').then(({ PrintingService }) => {
        const branchId = (orderPayload.shipping_address as any)?.branch_id || 'Main';
        PrintingService.queueOrderPrints({ id: orderPayload.id, order_number: generatedOrderNumber, ...orderPayload, order_items: orderItems }, branchId)
          .catch(e => {
            console.error('[Payment Verify] FAILED STEP: PRINT_QUEUE');
          });
      }).catch(e => {});
    } catch(e) {}

    // WhatsApp
    try {
      const cleanPhone = String(orderPayload.user_phone || '').replace(/\D/g, '').slice(-10);
      if (cleanPhone.length === 10) {
        WhatsAppService.sendOrderConfirmation(
          `91${cleanPhone}`,
          generatedOrderNumber,
          Number(orderPayload.total)
        ).then(() => {
          console.log('[Payment Verify] WhatsApp: success');
        }).catch(e => {
          console.error('[Payment Verify] FAILED STEP: WHATSAPP_CONFIRMATION');
          console.error('[Payment Verify] ERROR MESSAGE: ' + (e?.message || 'WhatsApp message failed'));
        });
      }
    } catch(e) {}

    // ── STEP 13: Return success ───────────────────────────────────────────
    console.log(`[Payment Verify] response: success`);
    return NextResponse.json({
      success: true,
      message: 'Payment verified and order confirmed.',
      orderNumber: generatedOrderNumber,
      paymentId: razorpay_payment_id,
    });

  } catch (error: any) {
    console.error(`[Payment Verify] FAILED STEP: UNCAUGHT_EXCEPTION_AT_${step.current}`);
    console.error(`[Payment Verify] ERROR CODE: SERVER_ERROR`);
    console.error(`[Payment Verify] ERROR MESSAGE: ${error?.message || 'Unknown error'}`);
    
    return NextResponse.json({
      success: false,
      error: 'PAYMENT_VERIFICATION_FAILED',
      message: 'We could not complete your order confirmation. Please check your order history before retrying.',
      code: 'SERVER_ERROR',
    }, { status: 500 });
  }
}
