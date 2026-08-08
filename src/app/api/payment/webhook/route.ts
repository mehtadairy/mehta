import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { WhatsAppService } from '@/lib/services/whatsapp';
import { generateOrderNumber } from '@/lib/order-utils';

export async function POST(request: Request) {
  const startTime = Date.now();
  let eventName = 'unknown';

  console.log("==================================================");
  console.log("[RazorpayWebhook] Incoming webhook request");

  try {
    const rawBody = await request.text();
    const signature = (request.headers.get('x-razorpay-signature') || '').trim();
    const rawSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const secret = (rawSecret || '').trim().replace(/^["']|["']$/g, '');

    // ── STEP 1: Signature Verification ──────────────────────────────────────
    if (!signature) {
      console.warn("[RazorpayWebhook] FAILED: x-razorpay-signature header missing");
      return NextResponse.json({ error: "Unauthorized - missing signature" }, { status: 401 });
    }

    if (!secret) {
      console.error("[RazorpayWebhook] FAILED: RAZORPAY_WEBHOOK_SECRET env var is missing");
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(Buffer.from(rawBody, 'utf-8'))
      .digest('hex');

    if (computedSignature !== signature) {
      console.warn("[RazorpayWebhook] FAILED: HMAC signature mismatch");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    console.log("[RazorpayWebhook] Signature verified OK");

    const payload = JSON.parse(rawBody);
    eventName = payload.event;
    console.log(`[RazorpayWebhook] Event: ${eventName}`);

    // ── STEP 2: Route by event type ─────────────────────────────────────────
    if (eventName === 'payment.captured' || eventName === 'payment.authorized') {
      return await handlePaymentSuccess(payload, eventName, startTime);
    }

    if (eventName === 'payment.failed') {
      return await handlePaymentFailed(payload);
    }

    if (eventName.startsWith('refund.')) {
      return await handleRefundEvent(payload, eventName);
    }

    console.log(`[RazorpayWebhook] Ignored unhandled event: ${eventName}`);
    return NextResponse.json({ status: 'ignored', event: eventName }, { status: 200 });

  } catch (error: any) {
    console.error(`[RazorpayWebhook] Uncaught error for event "${eventName}":`, error?.message || error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HANDLER: payment.captured / payment.authorized
// ═══════════════════════════════════════════════════════════════════════════
async function handlePaymentSuccess(payload: any, eventName: string, startTime: number) {
  const payment = payload.payload.payment.entity;
  const rzpPaymentId = payment.id;
  const rzpOrderId = payment.order_id;
  const notesOrderId = payment.notes?.order_id || payment.notes?.orderId;
  const rawPhone = payment.contact || payment.notes?.phone;
  const amountInRupees = payment.amount ? payment.amount / 100 : 0;

  console.log(`[RazorpayWebhook] PaymentSuccess: payment_id=${rzpPaymentId}, rzp_order_id=${rzpOrderId}, notes_order_id=${notesOrderId || 'NONE'}, amount=₹${amountInRupees}`);

  // ── Resolve internal order ──────────────────────────────────────────────
  let order: any = null;

  // 1. Best source: notes.order_id (our internal UUID sent when creating the Razorpay order)
  if (notesOrderId && typeof notesOrderId === 'string' && notesOrderId.trim() !== '') {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*), customer:customers(*)')
      .eq('id', notesOrderId)
      .maybeSingle();
    order = data;
    if (order) console.log(`[RazorpayWebhook] Order resolved via notes.order_id: ${order.id}`);
  }

  // 2. Fallback: look up by payment_id stored during create-order step
  if (!order && rzpOrderId) {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*), customer:customers(*)')
      .eq('payment_id', rzpOrderId)
      .maybeSingle();
    order = data;
    if (order) console.log(`[RazorpayWebhook] Order resolved via payment_id(rzp_order_id): ${order.id}`);
  }

  // 3. Fallback: phone + Pending status (narrow)
  if (!order && rawPhone) {
    const cleanDigits = String(rawPhone).replace(/\D/g, '').slice(-10);
    if (cleanDigits.length === 10) {
      const phoneVariants = [cleanDigits, `91${cleanDigits}`, `+91${cleanDigits}`];
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*), customer:customers(*)')
        .in('user_phone', phoneVariants)
        .eq('payment_status', 'Pending')
        .gte('created_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()) // within last 2 hours
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      order = data;
      if (order) console.log(`[RazorpayWebhook] Order resolved via phone lookup: ${order.id}`);
    }
  }

  // IMPORTANT: We do NOT fall back to "latest order in DB" — that would assign a payment to the wrong order.
  if (!order) {
    console.warn(`[RazorpayWebhook] No matching order for payment ${rzpPaymentId} — saving to recovery`);
    await supabase.from('payment_recovery').insert([{
      payment_id: rzpPaymentId,
      razorpay_order_id: rzpOrderId,
      amount: payment.amount,
      customer: payment.notes || {},
      payload: payload,
      status: 'pending',
      failure_reason: 'Order not found in database'
    }]).catch(e => console.error('[RazorpayWebhook] Failed to save recovery record:', e?.message));
    return NextResponse.json({ status: 'ok', detail: 'saved_to_recovery' }, { status: 200 });
  }

  // ── Idempotency check ───────────────────────────────────────────────────
  if (String(order.payment_status).toLowerCase() === 'paid') {
    console.log(`[RazorpayWebhook] Idempotency: order ${order.order_number || order.id} already Paid. Skip.`);
    return NextResponse.json({ status: 'ok', message: 'already_processed', orderId: order.id }, { status: 200 });
  }

  // Validate amount matches
  const expectedAmountPaise = Math.round(Number(order.total) * 100);
  if (payment.amount && payment.amount !== expectedAmountPaise) {
    console.error(`[RazorpayWebhook] Amount mismatch: expected ${expectedAmountPaise} paise, got ${payment.amount} — saving to recovery`);
    await supabase.from('payment_recovery').insert([{
      payment_id: rzpPaymentId,
      razorpay_order_id: rzpOrderId,
      amount: payment.amount,
      customer: payment.notes || {},
      payload: payload,
      status: 'pending',
      failure_reason: `Amount mismatch: expected ${expectedAmountPaise}, got ${payment.amount}`
    }]).catch(e => console.error('[RazorpayWebhook] Failed to save recovery record:', e?.message));
    return NextResponse.json({ status: 'ok', detail: 'amount_mismatch_saved_to_recovery' }, { status: 200 });
  }

  // ── Update order ────────────────────────────────────────────────────────
  let generatedOrderNumber = order.order_number;
  if (!generatedOrderNumber) {
    generatedOrderNumber = await generateOrderNumber(supabase);
  }

  // Try update with payment_completed_at (schema drift safe)
  let updateError: any = null;
  const primaryUpdate = await supabase
    .from('orders')
    .update({
      order_number: generatedOrderNumber,
      payment_status: 'Paid',
      status: 'Processing',
      payment_id: rzpPaymentId,
      payment_method: payment.method || 'Razorpay',
      payment_completed_at: new Date().toISOString(),
    })
    .eq('id', order.id);

  updateError = primaryUpdate.error;

  if (updateError && (updateError.code === '42703' || updateError.message?.includes('does not exist'))) {
    console.warn('[RazorpayWebhook] Schema drift on payment_completed_at — retrying without it');
    const fallbackUpdate = await supabase
      .from('orders')
      .update({
        order_number: generatedOrderNumber,
        payment_status: 'Paid',
        status: 'Processing',
        payment_id: rzpPaymentId,
      })
      .eq('id', order.id);
    updateError = fallbackUpdate.error;
  }

  if (updateError) {
    console.error('[RazorpayWebhook] Failed to update order:', updateError.message);
    await supabase.from('payment_recovery').insert([{
      payment_id: rzpPaymentId,
      razorpay_order_id: rzpOrderId,
      amount: payment.amount,
      customer: payment.notes || {},
      payload: payload,
      status: 'pending',
      failure_reason: updateError.message
    }]).catch(e => console.error('[RazorpayWebhook] Failed to save recovery record:', e?.message));
    return NextResponse.json({ status: 'ok', detail: 'saved_to_recovery' }, { status: 200 });
  }

  console.log(`[RazorpayWebhook] Order ${generatedOrderNumber} marked Paid & Processing OK`);

  // Refresh order data
  const { data: updatedOrder } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', order.id)
    .single();
  const finalOrder = updatedOrder || order;

  // ── Inventory decrement (non-blocking) ──────────────────────────────────
  const orderItems = finalOrder.order_items || order.order_items || [];
  for (const item of orderItems) {
    if (item.product_id && item.quantity) {
      supabase
        .from('products')
        .select('stock')
        .eq('id', item.product_id)
        .maybeSingle()
        .then(({ data: prod }) => {
          if (prod) {
            supabase.from('products').update({
              stock: Math.max(0, (prod.stock || 0) - item.quantity)
            }).eq('id', item.product_id).then(() => {});
          }
        });
    }
  }

  // ── Invoice (non-blocking) ───────────────────────────────────────────────
  let invoiceUrl = `https://mehtadairy.com/api/invoices/download?invoiceId=${order.id}`;
  let invoiceNumber = `INV-${order.id.slice(0, 8).toUpperCase()}`;
  try {
    const { createInvoice } = await import('@/lib/services/invoices');
    const invoiceObj = await createInvoice(order.id);
    if (invoiceObj) {
      invoiceUrl = invoiceObj.pdf_url || invoiceUrl;
      invoiceNumber = invoiceObj.invoice_number || invoiceNumber;
      console.log(`[RazorpayWebhook] Invoice generated: ${invoiceNumber}`);
    }
  } catch (e: any) {
    console.warn('[RazorpayWebhook] Invoice generation warning:', e?.message);
  }

  // ── WhatsApp notification (non-blocking) ────────────────────────────────
  const cleanPhone = rawPhone
    ? `91${String(rawPhone).replace(/\D/g, '').slice(-10)}`
    : (order.user_phone ? `91${String(order.user_phone).replace(/\D/g, '').slice(-10)}` : '');

  if (cleanPhone && cleanPhone.length >= 12) {
    try {
      const docRes = await WhatsAppService.sendInvoiceDocument(cleanPhone, invoiceUrl, generatedOrderNumber, invoiceNumber);
      if (!docRes.success) {
        await WhatsAppService.sendOrderConfirmation(cleanPhone, generatedOrderNumber, amountInRupees);
      }
      console.log(`[RazorpayWebhook] WhatsApp sent to ${cleanPhone}, success=${docRes.success}`);
    } catch (e: any) {
      console.warn('[RazorpayWebhook] WhatsApp warning:', e?.message);
    }
  }

  // ── Thermal print queue (non-blocking) ──────────────────────────────────
  try {
    const { PrintingService } = await import('@/lib/services/printing');
    const branchId = (finalOrder.shipping_address as any)?.branch_id || 'Main';
    await PrintingService.queueOrderPrints(finalOrder, branchId);
    console.log(`[RazorpayWebhook] Print job queued for branch ${branchId}`);
  } catch (e: any) {
    console.warn('[RazorpayWebhook] Print queue warning:', e?.message);
  }

  // ── System notifications (non-blocking) ─────────────────────────────────
  supabase.from('notifications').insert([
    { title: "🟢 New Paid Order", message: `${generatedOrderNumber} - ₹${amountInRupees} - ${order.user_name || 'Customer'}`, type: 'admin', order_id: order.id },
    { title: "🧁 Start Preparing", message: `${generatedOrderNumber} - ${orderItems.map((i: any) => i.product_name).join(', ') || 'Sweets'}`, type: 'worker', order_id: order.id }
  ]).then(() => {}).catch(e => console.warn('[RazorpayWebhook] Notifications warning:', e?.message));

  const totalTime = Date.now() - startTime;
  console.log(`[RazorpayWebhook] Payment success processed in ${totalTime}ms for order ${generatedOrderNumber}`);
  console.log("==================================================");

  return NextResponse.json({
    status: 'ok',
    event: eventName,
    orderId: order.id,
    orderNumber: generatedOrderNumber,
  }, { status: 200 });
}

// ═══════════════════════════════════════════════════════════════════════════
// HANDLER: payment.failed
// ═══════════════════════════════════════════════════════════════════════════
async function handlePaymentFailed(payload: any) {
  const payment = payload.payload.payment.entity;
  const rzpPaymentId = payment.id;
  const rzpOrderId = payment.order_id;
  const notesOrderId = payment.notes?.order_id || payment.notes?.orderId;
  const errorDesc = payment.error_description || payment.error_reason || 'Payment failed';

  console.log(`[RazorpayWebhook] PaymentFailed: payment_id=${rzpPaymentId}, error="${errorDesc}"`);

  // Find the order
  let orderId: string | null = notesOrderId || null;
  if (!orderId && rzpOrderId) {
    const { data } = await supabase.from('orders').select('id').eq('payment_id', rzpOrderId).maybeSingle();
    orderId = data?.id || null;
  }

  if (orderId) {
    const { error } = await supabase
      .from('orders')
      .update({ payment_status: 'Failed' })
      .eq('id', orderId)
      .eq('payment_status', 'Pending'); // only update if still Pending (idempotency)
    
    if (error) {
      console.warn('[RazorpayWebhook] Failed to update order payment_status to Failed:', error.message);
    } else {
      console.log(`[RazorpayWebhook] Order ${orderId} marked as payment Failed`);
    }
  } else {
    console.warn(`[RazorpayWebhook] No order found for failed payment ${rzpPaymentId}`);
  }

  return NextResponse.json({ status: 'ok', event: 'payment.failed' }, { status: 200 });
}

// ═══════════════════════════════════════════════════════════════════════════
// HANDLER: refund.* events
// ═══════════════════════════════════════════════════════════════════════════
async function handleRefundEvent(payload: any, eventName: string) {
  const refundEntity = payload.payload.refund.entity;
  const rzpRefundId = refundEntity.id;
  const rzpPaymentId = refundEntity.payment_id;
  const amountInRupees = refundEntity.amount ? refundEntity.amount / 100 : 0;

  console.log(`[RazorpayWebhook] RefundEvent: event=${eventName}, refund_id=${rzpRefundId}, payment_id=${rzpPaymentId}, amount=₹${amountInRupees}`);

  // Resolve order ID from the refund record
  let orderId: string | null = refundEntity.notes?.order_id || null;

  // Look up existing refund record
  const { data: existingRefund } = await supabase
    .from('refunds')
    .select('id, status, order_id, orders(id, order_number, user_phone, payment_status)')
    .or(`razorpay_refund_id.eq.${rzpRefundId},payment_id.eq.${rzpPaymentId}`)
    .maybeSingle();

  if (existingRefund) {
    orderId = existingRefund.order_id || orderId;
  }

  // ── refund.created ───────────────────────────────────────────────────────
  if (eventName === 'refund.created') {
    console.log(`[RazorpayWebhook] refund.created for ${rzpRefundId}`);
    if (orderId && !existingRefund) {
      const { error } = await supabase.from('refunds').insert([{
        order_id: orderId,
        payment_id: rzpPaymentId,
        razorpay_refund_id: rzpRefundId,
        amount: amountInRupees,
        currency: refundEntity.currency || 'INR',
        status: 'PENDING',
        reason: refundEntity.notes?.reason || 'Razorpay refund',
      }]);
      if (error) console.error('[RazorpayWebhook] Failed to create refund record:', error.message);
      else console.log(`[RazorpayWebhook] Refund record created for order ${orderId}`);
    }
    return NextResponse.json({ status: 'ok', event: eventName, refundId: rzpRefundId }, { status: 200 });
  }

  // ── refund.processed ─────────────────────────────────────────────────────
  if (eventName === 'refund.processed') {
    if (existingRefund?.status === 'PROCESSED') {
      console.log(`[RazorpayWebhook] Idempotency: refund ${rzpRefundId} already PROCESSED. Skip.`);
      return NextResponse.json({ status: 'ok', detail: 'already_processed' }, { status: 200 });
    }

    const { error: refundErr } = await supabase
      .from('refunds')
      .update({ razorpay_refund_id: rzpRefundId, status: 'PROCESSED', processed_at: new Date().toISOString() })
      .or(`razorpay_refund_id.eq.${rzpRefundId},payment_id.eq.${rzpPaymentId}`);

    if (refundErr) console.error('[RazorpayWebhook] refund.processed update failed:', refundErr.message);
    else console.log(`[RazorpayWebhook] Refund ${rzpRefundId} marked PROCESSED`);

    if (orderId) {
      await supabase.from('orders').update({ payment_status: 'Refund Completed' }).eq('id', orderId);
    } else if (rzpPaymentId) {
      await supabase.from('orders').update({ payment_status: 'Refund Completed' }).eq('payment_id', rzpPaymentId);
    }

    // Notify customer
    const targetOrder = existingRefund?.orders as any;
    const userPhone = targetOrder?.user_phone || refundEntity.notes?.phone;
    const orderNum = targetOrder?.order_number || 'Order';
    if (userPhone) {
      const cleanPhone = `91${String(userPhone).replace(/\D/g, '').slice(-10)}`;
      WhatsAppService.sendNotification('order_cancelled', cleanPhone, [orderNum, `Your refund of ₹${amountInRupees} for ${orderNum} has been processed.`])
        .catch(e => console.warn('[RazorpayWebhook] WhatsApp refund notification failed:', e?.message));
    }

    return NextResponse.json({ status: 'ok', event: eventName, refundId: rzpRefundId }, { status: 200 });
  }

  // ── refund.failed ────────────────────────────────────────────────────────
  if (eventName === 'refund.failed') {
    if (existingRefund?.status === 'FAILED') {
      console.log(`[RazorpayWebhook] Idempotency: refund ${rzpRefundId} already FAILED. Skip.`);
      return NextResponse.json({ status: 'ok', detail: 'already_failed' }, { status: 200 });
    }

    const failureReason = refundEntity.status_details?.reason || 'Razorpay refund failed';
    const { error: refundErr } = await supabase
      .from('refunds')
      .update({ razorpay_refund_id: rzpRefundId, status: 'FAILED', failed_at: new Date().toISOString(), failure_reason: failureReason })
      .or(`razorpay_refund_id.eq.${rzpRefundId},payment_id.eq.${rzpPaymentId}`);

    if (refundErr) console.error('[RazorpayWebhook] refund.failed update failed:', refundErr.message);
    else console.log(`[RazorpayWebhook] Refund ${rzpRefundId} marked FAILED: ${failureReason}`);

    if (orderId) {
      await supabase.from('orders').update({ payment_status: 'Refund Failed' }).eq('id', orderId);
    } else if (rzpPaymentId) {
      await supabase.from('orders').update({ payment_status: 'Refund Failed' }).eq('payment_id', rzpPaymentId);
    }

    const targetOrder = existingRefund?.orders as any;
    const userPhone = targetOrder?.user_phone || refundEntity.notes?.phone;
    const orderNum = targetOrder?.order_number || 'Order';
    if (userPhone) {
      const cleanPhone = `91${String(userPhone).replace(/\D/g, '').slice(-10)}`;
      WhatsAppService.sendNotification('order_cancelled', cleanPhone, [orderNum, `Your refund for ${orderNum} could not be processed automatically. Our support team will assist you.`])
        .catch(e => console.warn('[RazorpayWebhook] WhatsApp refund failed notification error:', e?.message));
    }

    return NextResponse.json({ status: 'ok', event: eventName, refundId: rzpRefundId }, { status: 200 });
  }

  // ── refund.reversed ──────────────────────────────────────────────────────
  if (eventName === 'refund.reversed') {
    if (existingRefund?.status === 'REVERSED') {
      console.log(`[RazorpayWebhook] Idempotency: refund ${rzpRefundId} already REVERSED. Skip.`);
      return NextResponse.json({ status: 'ok', detail: 'already_reversed' }, { status: 200 });
    }

    const reversalReason = refundEntity.status_details?.reason || 'Refund reversed by bank';
    const { error: refundErr } = await supabase
      .from('refunds')
      .update({ razorpay_refund_id: rzpRefundId, status: 'REVERSED', reversed_at: new Date().toISOString(), reversal_reason: reversalReason })
      .or(`razorpay_refund_id.eq.${rzpRefundId},payment_id.eq.${rzpPaymentId}`);

    if (refundErr) console.error('[RazorpayWebhook] refund.reversed update failed:', refundErr.message);
    else console.log(`[RazorpayWebhook] Refund ${rzpRefundId} marked REVERSED`);

    if (orderId) {
      await supabase.from('orders').update({ payment_status: 'Refund Reversed' }).eq('id', orderId);
    } else if (rzpPaymentId) {
      await supabase.from('orders').update({ payment_status: 'Refund Reversed' }).eq('payment_id', rzpPaymentId);
    }

    const targetOrder = existingRefund?.orders as any;
    const userPhone = targetOrder?.user_phone || refundEntity.notes?.phone;
    const orderNum = targetOrder?.order_number || 'Order';
    if (userPhone) {
      const cleanPhone = `91${String(userPhone).replace(/\D/g, '').slice(-10)}`;
      WhatsAppService.sendNotification('order_cancelled', cleanPhone, [orderNum, `Your refund for ${orderNum} was reversed by the issuing bank. Our team will review and get in touch with you.`])
        .catch(e => console.warn('[RazorpayWebhook] WhatsApp refund reversed notification error:', e?.message));
    }

    return NextResponse.json({ status: 'ok', event: eventName, refundId: rzpRefundId }, { status: 200 });
  }

  console.log(`[RazorpayWebhook] Unhandled refund sub-event: ${eventName}`);
  return NextResponse.json({ status: 'ignored', event: eventName }, { status: 200 });
}
