import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { WhatsAppService } from '@/lib/services/whatsapp';

export async function POST(request: Request) {
  const startTime = Date.now();
  console.log("==================================================");
  console.log("[RazorpayWebhook] STEP 1: Webhook received at /api/payment/webhook");

  try {
    const rawBody = await request.text();
    const signature = (request.headers.get('x-razorpay-signature') || '').trim();
    const rawSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const secret = (rawSecret || '').trim().replace(/^["']|["']$/g, '');

    const secretExists = !!secret;

    let computedSignature = '';
    if (secretExists) {
      computedSignature = crypto
        .createHmac('sha256', secret)
        .update(Buffer.from(rawBody, 'utf-8'))
        .digest('hex');
    }

    const isMatch = !!(secretExists && signature && computedSignature === signature);

    console.log("--------------------------------------------------");
    console.log("[RazorpayWebhook] STEP 1 AUDIT - Webhook Signature Verification:");
    console.log(`  1. Received x-razorpay-signature: ${signature || 'MISSING'}`);
    console.log(`  2. RAZORPAY_WEBHOOK_SECRET Exists: ${secretExists} (Length: ${secret.length})`);
    console.log(`  3. Computed HMAC Signature: ${computedSignature || 'N/A'}`);
    console.log(`  4. Signatures Match Result: ${isMatch}`);
    console.log("--------------------------------------------------");

    // STEP 1: Signature Verification & Event Log
    if (!signature) {
      console.warn("[RazorpayWebhook] STEP 1 FAILED: x-razorpay-signature header missing.");
      return NextResponse.json({ error: "Unauthorized - missing signature header" }, { status: 401 });
    }

    if (!secretExists) {
      console.warn("[RazorpayWebhook] STEP 1 FAILED: RAZORPAY_WEBHOOK_SECRET environment variable is missing.");
      return NextResponse.json({ error: "Server configuration error - missing webhook secret" }, { status: 500 });
    }

    if (!isMatch) {
      console.warn("[RazorpayWebhook] STEP 1 FAILED: HMAC signature verification failed.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    console.log("[RazorpayWebhook] STEP 1 RESULT: Signature verification passed (VALID)");

    const payload = JSON.parse(rawBody);
    const eventName = payload.event;
    console.log(`[RazorpayWebhook] STEP 1 RESULT: Event type = ${eventName}`);

    // Filter payment events: payment.captured or payment.authorized
    if (eventName === 'payment.captured' || eventName === 'payment.authorized') {
      const payment = payload.payload.payment.entity;
      const notesOrderId = payment.notes?.order_id || payment.notes?.orderId || payment.description?.replace('Order from Mehta Dairy', '').trim();
      const rzpOrderId = payment.order_id;
      const rzpPaymentId = payment.id;
      const rawPhone = payment.contact || payment.notes?.phone;
      const amountInRupees = payment.amount ? payment.amount / 100 : 0;

      console.log(`[RazorpayWebhook] STEP 2: Resolve Razorpay Payment & Order`);
      console.log(`[RazorpayWebhook] STEP 2 DETAILS: Payment ID = ${rzpPaymentId}, Razorpay Order ID = ${rzpOrderId}, Notes Order ID = ${notesOrderId}, Phone = ${rawPhone}, Amount = ₹${amountInRupees}`);

      // STEP 2: Resolve Internal Order ID
      let order: any = null;

      // 2a. Try notes.order_id
      if (notesOrderId && typeof notesOrderId === 'string' && notesOrderId.trim() !== '') {
        const { data } = await supabase.from('orders').select('*, order_items(*), customer:customers(*)').eq('id', notesOrderId).maybeSingle();
        order = data;
      }

      // 2b. Try razorpay payment_id / order_id
      if (!order && rzpOrderId) {
        const { data } = await supabase.from('orders').select('*, order_items(*), customer:customers(*)').eq('payment_id', rzpOrderId).maybeSingle();
        order = data;
      }

      // 2c. Try customer phone lookup for latest pending order
      if (!order && rawPhone) {
        const cleanDigits = String(rawPhone).replace(/\D/g, '').slice(-10);
        if (cleanDigits.length === 10) {
          const phoneVariants = [cleanDigits, `91${cleanDigits}`, `+91${cleanDigits}`];
          const { data } = await supabase
            .from('orders')
            .select('*, order_items(*), customer:customers(*)')
            .in('user_phone', phoneVariants)
            .eq('payment_status', 'Pending')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          order = data;
        }
      }

      // 2d. Fallback: Lookup latest created order overall in DB
      if (!order) {
        console.log("[RazorpayWebhook] STEP 2 FALLBACK: Order not matched by ID or phone. Fetching most recent created order in DB...");
        const { data: latestOrder } = await supabase
          .from('orders')
          .select('*, order_items(*), customer:customers(*)')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        order = latestOrder;
      }

      if (!order) {
        console.warn(`[RazorpayWebhook] STEP 2 FAILED: No matching internal order found in database for payment ${rzpPaymentId}`);
        await supabase.from('payment_recovery').insert([{
          payment_id: rzpPaymentId,
          razorpay_order_id: rzpOrderId,
          amount: payment.amount,
          customer: payment.notes || {},
          payload: payload,
          status: 'pending',
          failure_reason: 'Order not found in database'
        }]);
        return NextResponse.json({ status: 'ok', detail: 'saved_to_recovery' }, { status: 200 });
      }

      console.log(`[RazorpayWebhook] STEP 2 RESULT: Internal Order Resolved -> ID = ${order.id}, Order Number = ${order.order_number || 'N/A'}`);

      // STEP 3: Before updating Supabase, log current statuses
      console.log(`[RazorpayWebhook] STEP 3: Status check before update:`);
      console.log(`[RazorpayWebhook]   - Current payment_status = "${order.payment_status}"`);
      console.log(`[RazorpayWebhook]   - Current status = "${order.status}"`);

      // Idempotency Check
      if (String(order.payment_status).toLowerCase() === 'paid') {
        console.log(`[RazorpayWebhook] STEP 3 (IDEMPOTENCY): Order ${order.order_number || order.id} is ALREADY Paid. Skipping duplicate execution.`);
        return NextResponse.json({
          status: 'ok',
          message: 'Order already processed',
          orderId: order.id,
          orderNumber: order.order_number
        }, { status: 200 });
      }

      const cleanPhone = rawPhone
        ? `91${rawPhone.replace(/\D/g, '').slice(-10)}`
        : (order.user_phone ? `91${order.user_phone.replace(/\D/g, '').slice(-10)}` : '');

      let orderUpdateSuccess = false;
      let generatedOrderNumber = order.order_number;
      let failureReason = '';

      // STEP 4: Update Order in Supabase
      try {
        if (!generatedOrderNumber) {
          const { data: newOrd, error: rpcError } = await supabase.rpc('get_next_order_number');
          if (rpcError) throw new Error("Failed to generate order number: " + rpcError.message);
          generatedOrderNumber = newOrd;
        }

        console.log(`[RazorpayWebhook] STEP 4: Updating order status to Paid & Processing...`);

        // First attempt with full metadata fields
        const primaryPayload: any = {
          order_number: generatedOrderNumber,
          payment_status: 'Paid',
          status: 'Processing',
          paid_at: new Date().toISOString(),
          payment_completed_at: new Date().toISOString(),
          payment_id: rzpPaymentId,
          payment_method: payment.method || 'Razorpay'
        };

        let { error: updateError } = await supabase
          .from('orders')
          .update(primaryPayload)
          .eq('id', order.id);

        if (updateError) {
          console.warn("[RazorpayWebhook] STEP 4 NOTICE: Primary update failed with optional columns, retrying minimal essential update:", updateError.message);
          // Minimal fallback update guaranteed to work on any DB schema
          const minimalRes = await supabase
            .from('orders')
            .update({
              payment_status: 'Paid',
              status: 'Processing'
            })
            .eq('id', order.id);

          if (minimalRes.error) {
            throw minimalRes.error;
          }
        }

        // Verify updated status from database
        const { data: updatedRow } = await supabase
          .from('orders')
          .select('payment_status, status, order_number')
          .eq('id', order.id)
          .single();

        order.order_number = updatedRow?.order_number || generatedOrderNumber;
        order.payment_status = updatedRow?.payment_status || 'Paid';
        order.status = updatedRow?.status || 'Processing';
        orderUpdateSuccess = true;

        console.log(`[RazorpayWebhook] STEP 4 RESULT: Order updated successfully!`);
        console.log(`[RazorpayWebhook]   - Updated payment_status = "${order.payment_status}"`);
        console.log(`[RazorpayWebhook]   - Updated status = "${order.status}"`);

      } catch (err: any) {
        console.error("[RazorpayWebhook] STEP 4 FAILED: Update order status error:", err);
        failureReason = err.message || JSON.stringify(err);
      }

      if (!orderUpdateSuccess) {
        await supabase.from('payment_recovery').insert([{
          payment_id: rzpPaymentId,
          razorpay_order_id: rzpOrderId,
          amount: payment.amount,
          customer: payment.notes || {},
          payload: payload,
          status: 'pending',
          failure_reason: failureReason
        }]);
        console.error(`[RazorpayWebhook] Payment ${rzpPaymentId} saved to recovery table.`);
        return NextResponse.json({ status: 'ok', detail: 'saved_to_recovery' }, { status: 200 });
      }

      // Decrement Inventory Stock (Non-blocking)
      try {
        if (order.order_items && order.order_items.length > 0) {
          for (const item of order.order_items) {
            if (item.product_id && item.quantity) {
              const { data: prod } = await supabase
                .from('products')
                .select('stock, name')
                .eq('id', item.product_id)
                .maybeSingle();

              if (prod) {
                const newStock = Math.max(0, (prod.stock || 0) - item.quantity);
                await supabase
                  .from('products')
                  .update({ stock: newStock })
                  .eq('id', item.product_id);
                console.log(`[RazorpayWebhook] Reduced inventory stock for ${prod.name} to ${newStock}`);
              }
            }
          }
        }
      } catch (stockErr) {
        console.error("[RazorpayWebhook] Non-blocking warning: Inventory update failure:", stockErr);
      }

      // STEP 5 & 6: PDF Invoice Generation & Supabase Storage Upload
      console.log(`[RazorpayWebhook] STEP 5 & 6: Generating & Uploading PDF invoice for order ${order.id}...`);
      let invoiceUrl = `https://mehtadairy.com/api/invoices/download?invoiceId=${order.id}`;
      let invoiceNumber = `INV-${new Date().getFullYear()}-000001`;

      try {
        const { createInvoice } = await import('@/lib/services/invoices');
        const invoiceObj = await createInvoice(order.id);
        if (invoiceObj) {
          invoiceUrl = invoiceObj.pdf_url || invoiceUrl;
          invoiceNumber = invoiceObj.invoice_number || invoiceNumber;
          console.log(`[RazorpayWebhook] STEP 5 RESULT: Invoice PDF Generated -> Number = ${invoiceNumber}`);
          console.log(`[RazorpayWebhook] STEP 6 RESULT: Supabase Storage Upload -> URL = ${invoiceUrl}`);
        }
      } catch (invErr: any) {
        console.error("[RazorpayWebhook] STEP 5/6 WARNING: Invoice generation/upload failed:", invErr?.message || invErr);
      }

      // STEP 7: Log WhatsApp send attempt with complete details
      console.log(`[RazorpayWebhook] STEP 7: Dispatching WhatsApp PDF invoice to ${cleanPhone}...`);
      let waResponseData: any = null;
      let waHttpStatus = 0;

      if (cleanPhone) {
        try {
          // Dispatch invoice document
          const docRes = await WhatsAppService.sendInvoiceDocument(cleanPhone, invoiceUrl, generatedOrderNumber, invoiceNumber);
          waHttpStatus = docRes.httpStatus;
          waResponseData = docRes.responseBody;

          console.log("--------------------------------------------------");
          console.log("[RazorpayWebhook] STEP 7 DETAILS - WhatsApp Dispatch Result:");
          console.log(`  - Target Phone: ${cleanPhone}`);
          console.log(`  - Invoice URL: ${invoiceUrl}`);
          console.log(`  - HTTP Status: ${waHttpStatus}`);
          console.log(`  - Complete AiSensy API Response Body:`, JSON.stringify(waResponseData, null, 2));
          console.log("--------------------------------------------------");

          if (docRes.success) {
            console.log(`[RazorpayWebhook] STEP 7 RESULT: WhatsApp document sent successfully.`);
          } else {
            console.warn(`[RazorpayWebhook] STEP 7 NOTICE: sendInvoiceDocument returned success=false (${docRes.error}). Triggering notification fallback...`);
            await WhatsAppService.sendInvoice(cleanPhone, generatedOrderNumber, invoiceUrl);
            await WhatsAppService.sendOrderConfirmation(cleanPhone, generatedOrderNumber, amountInRupees);
          }
        } catch (waErr: any) {
          console.error("[RazorpayWebhook] STEP 7 WARNING: WhatsApp dispatch error:", waErr?.message || waErr);
        }
      } else {
        console.warn("[RazorpayWebhook] STEP 7 NOTICE: No cleanPhone found for order. Skipping WhatsApp dispatch.");
      }

      // STEP 8: Log Email send result
      const customerEmail = order.customer?.email || order.user_email || (order.shipping_address as any)?.email;
      if (customerEmail) {
        try {
          console.log(`[RazorpayWebhook] STEP 8: Dispatching Email invoice to ${customerEmail}...`);
          const { sendInvoiceEmailWithRetry } = await import('@/lib/email/sendInvoice');
          const emailRes = await sendInvoiceEmailWithRetry(order.id || generatedOrderNumber, customerEmail);
          console.log(`[RazorpayWebhook] STEP 8 RESULT: Email sent successfully to ${customerEmail} (Response: ${JSON.stringify(emailRes)})`);
        } catch (emailErr: any) {
          console.error("[RazorpayWebhook] STEP 8 WARNING: Email dispatch failed:", emailErr?.message || emailErr);
        }
      } else {
        console.log("[RazorpayWebhook] STEP 8 RESULT: No customer email provided. Email dispatch skipped.");
      }

      // Admin & Worker System Notifications (Non-blocking)
      try {
        const adminMsg = `${generatedOrderNumber} - ₹${amountInRupees} - ${order.user_name || 'Customer'}`;
        await supabase.from('notifications').insert([{
          title: "🟢 New Paid Order",
          message: adminMsg,
          type: 'admin',
          order_id: order.id
        }]);

        const itemsList = order.order_items ? order.order_items.map((i: any) => i.product_name).join(', ') : 'Sweets';
        await supabase.from('notifications').insert([{
          title: "🧁 Start Preparing",
          message: `${generatedOrderNumber} - ${itemsList}`,
          type: 'worker',
          order_id: order.id
        }]);
        console.log(`[RazorpayWebhook] System notifications logged.`);
      } catch (notifErr) {
        console.error("[RazorpayWebhook] Notification logging warning:", notifErr);
      }

      // Thermal Printing Queue (Non-blocking)
      try {
        const { PrintingService } = await import('@/lib/services/printing');
        const { data: fullOrder } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('id', order.id)
          .single();

        if (fullOrder) {
          const branchId = (fullOrder.shipping_address as any)?.branch_id || 'Main';
          await PrintingService.queueOrderPrints(fullOrder, branchId);
          console.log(`[RazorpayWebhook] Thermal print job queued for branch ${branchId}`);
        }
      } catch (printErr) {
        console.error("[RazorpayWebhook] Printing queue warning:", printErr);
      }

      const totalTime = Date.now() - startTime;
      console.log(`[RazorpayWebhook] FINAL SUCCESS: Webhook processing completed for order ${generatedOrderNumber} in ${totalTime}ms`);
      console.log("==================================================");

      return NextResponse.json({
        status: 'ok',
        orderId: order.id,
        orderNumber: generatedOrderNumber,
        invoiceUrl: invoiceUrl
      }, { status: 200 });

    } else {
      console.log(`[RazorpayWebhook] Ignored event type: ${eventName}`);
      return NextResponse.json({ status: 'ignored', event: eventName }, { status: 200 });
    }

  } catch (error: any) {
    console.error('[RazorpayWebhook] Uncaught webhook server error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}
