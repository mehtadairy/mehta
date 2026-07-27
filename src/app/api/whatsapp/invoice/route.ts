import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { validateCustomerId, isTestModeRequest, isValidUUID } from '@/lib/services/whatsapp-validation';
import { createInvoice, generateInvoicePDF } from '@/lib/services/invoices';
import { WhatsAppService } from '@/lib/services/whatsapp';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'onboarding@resend.dev';

export async function POST(req: Request) {
  const startTime = Date.now();
  let body: any = {};

  try {
    try {
      body = await req.json();
    } catch (err) {
      body = {};
    }

    // LOG: Incoming request body
    console.log("========== WhatsApp API ==========");
    console.log("Endpoint: /api/whatsapp/invoice");
    console.log("Incoming Body:");
    console.log(JSON.stringify(body, null, 2));

    // Test Mode Detection
    if (isTestModeRequest(body)) {
      console.log("[AiSensy Test Mode] invoice endpoint");
      const mockRes = {
        success: true,
        invoiceId: "00000000-0000-4000-8000-000000000003",
        invoiceNumber: "INV-TEST-001",
        invoiceUrl: "https://example.com/invoice.pdf",
        orderId: "TEST-ORDER-001",
        customerName: "Test User",
        totalAmount: 540,
        testMode: true
      };
      console.log("[InvoiceAPI] Returned response (Test Mode):", JSON.stringify(mockRes, null, 2));
      console.log("==================================");
      return NextResponse.json(mockRes, { status: 200 });
    }

    const { customerId, orderId } = body;
    console.log("[InvoiceAPI] Resolved customerId:", customerId, "orderId:", orderId);

    // STEP 1: Customer & Order Resolution
    let customer: any = null;
    let order: any = null;

    if (customerId && typeof customerId === 'string' && isValidUUID(customerId)) {
      const { data, error: cErr } = await supabase.from('customers').select('*').eq('id', customerId).maybeSingle();
      if (cErr) {
        console.error('[InvoiceAPI] Step: customer_lookup failed with DB error:', cErr);
        return NextResponse.json({
          success: false,
          step: "customer_lookup",
          error: cErr.message || "Database error retrieving customer."
        }, { status: 200 });
      }
      customer = data;
    }

    // Order Resolution (orderId backward compatibility vs customerId resolution)
    if (orderId && typeof orderId === 'string' && orderId.trim() !== '' && !isTestModeRequest({ orderId })) {
      const { data, error: oErr } = await supabase
        .from('orders')
        .select('*, order_items(*), customer:customers(*)')
        .eq('id', orderId)
        .maybeSingle();
      if (oErr) {
        console.error('[InvoiceAPI] Step: order_lookup failed with DB error:', oErr);
        return NextResponse.json({
          success: false,
          step: "order_lookup",
          error: oErr.message || "Database error retrieving order."
        }, { status: 200 });
      }
      order = data;
    }

    if (!order && customer) {
      // Find customer's most recently created order
      const { data, error: oErr } = await supabase
        .from('orders')
        .select('*, order_items(*), customer:customers(*)')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (oErr) {
        console.error('[InvoiceAPI] Step: order_lookup failed with DB error:', oErr);
        return NextResponse.json({
          success: false,
          step: "order_lookup",
          error: oErr.message || "Database error retrieving order."
        }, { status: 200 });
      }
      order = data;
    }

    if (!order) {
      console.log("[InvoiceAPI] Order not found by customerId. Fetching most recent created order in DB...");
      const { data: latestOrder } = await supabase
        .from('orders')
        .select('*, order_items(*), customer:customers(*)')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      order = latestOrder;
    }

    if (!order) {
      console.warn("[InvoiceAPI] Step: order_lookup failed: No matching order found.");
      return NextResponse.json({
        success: false,
        step: "order_lookup",
        error: "No matching order found."
      }, { status: 200 });
    }

    if (!customer && order.customer) {
      customer = order.customer;
    }

    console.log(`[InvoiceAPI] Order created / resolved successfully: ${order.order_number || order.id} (${order.id})`);

    // Ensure order is marked Paid & Processing if it is currently Pending
    if (order.payment_status !== 'Paid') {
      try {
        console.log(`[InvoiceAPI] Updating order ${order.id} payment_status to Paid`);
        await supabase
          .from('orders')
          .update({
            payment_status: 'Paid',
            status: 'Processing',
            paid_at: new Date().toISOString(),
            payment_completed_at: new Date().toISOString()
          })
          .eq('id', order.id);
        order.payment_status = 'Paid';
        order.status = 'Processing';
      } catch (updateErr: any) {
        console.error('[InvoiceAPI] Non-blocking order payment_status update warning:', updateErr);
      }
    }

    // STEP 2: Invoice Record Generation
    console.log("[InvoiceAPI] Invoice generation started");
    let pdfBuffer: Buffer | null = null;
    let invoiceData: any = null;

    try {
      invoiceData = await createInvoice(order.id);
      console.log(`[InvoiceAPI] Invoice record generated successfully: ${invoiceData?.invoice_number}`);
    } catch (invGenErr: any) {
      console.error("[InvoiceAPI] Step: invoice_generation failed:", invGenErr);
      return NextResponse.json({
        success: false,
        step: "invoice_generation",
        error: invGenErr.message || String(invGenErr)
      }, { status: 200 });
    }

    if (!invoiceData) {
      return NextResponse.json({
        success: false,
        step: "invoice_generation",
        error: "Failed to generate invoice record."
      }, { status: 200 });
    }

    // STEP 3: Invoice PDF Generation
    try {
      console.log("[InvoiceAPI] Invoice PDF generation started");
      const orderWithInvoice = {
        ...order,
        invoice_number: invoiceData.invoice_number,
        invoice_created_at: invoiceData.created_at || new Date().toISOString()
      };
      pdfBuffer = await generateInvoicePDF(orderWithInvoice);
      console.log(`[InvoiceAPI] Invoice PDF generated successfully (${pdfBuffer.length} bytes)`);
    } catch (pdfErr: any) {
      console.error("[InvoiceAPI] Step: pdf_generation failed:", pdfErr);
      return NextResponse.json({
        success: false,
        step: "pdf_generation",
        error: pdfErr.message || String(pdfErr)
      }, { status: 200 });
    }

    // STEP 4: Invoice Storage Upload & Public URL
    let pdfUrl = invoiceData.pdf_url;
    if (!pdfUrl || !pdfUrl.startsWith('http')) {
      try {
        console.log("[InvoiceAPI] Invoice upload started");
        const currentYear = new Date().getFullYear();
        const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");
        const storagePath = `${currentYear}/${currentMonth}/${invoiceData.invoice_number}.pdf`;

        const uploadResult = await supabase.storage.from('invoices').upload(storagePath, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true
        });

        if (uploadResult.error) {
          console.error("[InvoiceAPI] Storage upload error:", uploadResult.error.message);
          throw new Error(uploadResult.error.message);
        }
        console.log("[InvoiceAPI] Invoice upload completed");

        const { data: publicUrlData } = supabase.storage.from('invoices').getPublicUrl(storagePath);
        pdfUrl = publicUrlData?.publicUrl || `https://mehtadairy.com/api/invoices/download?invoiceId=${order.id}`;
        console.log("[InvoiceAPI] Public URL generated:", pdfUrl);

        // Update invoice & order record with resolved public URL
        await supabase.from('invoices').update({ pdf_url: pdfUrl }).eq('id', invoiceData.id);
        await supabase.from('orders').update({ invoice_url: pdfUrl }).eq('id', order.id);
      } catch (uploadErr: any) {
        console.error("[InvoiceAPI] Step: storage_upload failed:", uploadErr);
        pdfUrl = `https://mehtadairy.com/api/invoices/download?invoiceId=${order.id}`;
      }
    } else {
      console.log("[InvoiceAPI] Public URL generated / resolved:", pdfUrl);
    }

    // STEP 5: WhatsApp Invoice Sending
    let whatsappStatus = "skipped";
    const rawPhone = customer?.phone || order.user_phone || '';
    const cleanDigits = String(rawPhone).replace(/\D/g, '').slice(-10);
    const cleanPhone = cleanDigits.length === 10 ? `91${cleanDigits}` : '';

    if (cleanPhone && pdfUrl) {
      try {
        console.log(`[InvoiceAPI] WhatsApp invoice message sending started to ${cleanPhone}`);
        const waResult = await WhatsAppService.sendInvoiceDocument(cleanPhone, pdfUrl, order.order_number || 'WA-ORDER', invoiceData.invoice_number);
        console.log("[InvoiceAPI] WhatsApp API response:", JSON.stringify(waResult));
        whatsappStatus = waResult.success ? "sent" : "failed";
      } catch (waErr: any) {
        console.error("[InvoiceAPI] Step: whatsapp_sending failed:", waErr);
        whatsappStatus = "failed";
      }
    } else {
      console.warn("[InvoiceAPI] Skipping WhatsApp send: cleanPhone or pdfUrl missing.");
    }

    // STEP 6: Email Invoice Sending
    let emailStatus = "skipped";
    const userEmail = customer?.email || order.user_email;
    if (userEmail && pdfBuffer) {
      try {
        console.log(`[InvoiceAPI] Email invoice sending started to ${userEmail}`);
        const emailRes = await resend.emails.send({
          from: SENDER_EMAIL,
          to: userEmail,
          subject: `Invoice ${invoiceData.invoice_number} from Mehta Sweet Mart`,
          html: `<p>Dear ${order.user_name || 'Customer'},</p><p>Thank you for your order with Mehta Sweet Mart! Please find your official invoice attached.</p><p>Order ID: ${order.order_number || order.id}</p><p>Total Amount: ₹${order.total}</p>`,
          attachments: [
            {
              filename: `${invoiceData.invoice_number}.pdf`,
              content: pdfBuffer
            }
          ]
        });
        console.log("[InvoiceAPI] Email API response:", JSON.stringify(emailRes));
        emailStatus = "sent";
      } catch (emailErr: any) {
        console.error("[InvoiceAPI] Step: email_sending non-blocking warning:", emailErr);
        emailStatus = "failed";
      }
    }

    const responseTime = Date.now() - startTime;
    console.log("[InvoiceAPI] Final success achieved in", responseTime, "ms");

    const successRes = {
      success: true,
      invoiceId: invoiceData.id,
      invoiceNumber: invoiceData.invoice_number,
      invoiceUrl: pdfUrl,
      orderId: order.id,
      customerName: order.user_name || customer?.name || "Customer",
      totalAmount: order.total,
      details: {
        whatsappStatus,
        emailStatus,
        responseTimeMs: responseTime
      }
    };

    console.log("[InvoiceAPI] Returned response:", JSON.stringify(successRes, null, 2));
    return NextResponse.json(successRes, { status: 200 });

  } catch (uncaughtErr: any) {
    console.error('[InvoiceAPI] Step: uncaught_server_error:', uncaughtErr);
    return NextResponse.json({
      success: false,
      step: "uncaught_server_error",
      error: uncaughtErr.message || String(uncaughtErr)
    }, { status: 200 });
  }
}
