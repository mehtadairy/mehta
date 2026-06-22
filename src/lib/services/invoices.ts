import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Resend } from "resend";
import { supabase } from "@/lib/supabaseClient";

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'onboarding@resend.dev';

export interface InvoiceData {
  id: string;
  invoice_number: string;
  order_id: string;
  customer_id: string | null;
  pdf_url: string | null;
  created_at: string;
}

/**
 * Generate a professional PDF invoice using jsPDF and jspdf-autotable
 */
export function generateInvoicePDF(order: any): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  // Page dimensions
  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 15;

  // Colors
  const primaryColor: [number, number, number] = [212, 109, 45]; // #D46D2D (Brand Orange)
  const secondaryColor: [number, number, number] = [31, 30, 28]; // #1F1E1C (Brand Charcoal)
  const goldColor: [number, number, number] = [197, 168, 128]; // #C5A880 (Gold)
  const lightBeige: [number, number, number] = [244, 239, 230]; // #F4EFE6

  // 1. Header Section
  // Background top accent bar
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 8, "F");

  // Logo text
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("MEHTA DAIRY", margin, 24);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("Premium Sweets, Farsan & Gifting Since 1952", margin, 29);

  // Business info (Right side)
  doc.setFontSize(9);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFont("Helvetica", "bold");
  doc.text("Mehta Sweet Mart", pageWidth - margin, 20, { align: "right" });
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text("GSTIN: 24AAAAM5252M1Z9", pageWidth - margin, 24, { align: "right" });
  doc.text("Near Bhidbhanjan Mahadev Mandir, Taleti Road, Navagadh", pageWidth - margin, 28, { align: "right" });
  doc.text("Palitana, Gujarat - 364270", pageWidth - margin, 32, { align: "right" });
  doc.text("Contact: +91 99132 52232", pageWidth - margin, 36, { align: "right" });

  // Horizontal separator
  doc.setDrawColor(goldColor[0], goldColor[1], goldColor[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, 42, pageWidth - margin, 42);

  // 2. Invoice Details Block
  doc.setFontSize(14);
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("TAX INVOICE", margin, 52);

  doc.setFontSize(9);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text(`Invoice No: ${order.invoice_number}`, margin, 58);
  doc.setFont("Helvetica", "normal");
  doc.text(`Invoice Date: ${new Date(order.invoice_created_at || order.created_at).toLocaleDateString()}`, margin, 63);
  doc.text(`Order Ref: ${order.order_number}`, margin, 68);

  // Bill To (Right side)
  const rightColX = pageWidth / 2 + 10;
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("BILL & DELIVER TO", rightColX, 52);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text(`Customer: ${order.user_name || "Valued Customer"}`, rightColX, 58);
  doc.text(`Phone: ${order.user_phone || "N/A"}`, rightColX, 63);
  if (order.user_email) {
    doc.text(`Email: ${order.user_email}`, rightColX, 68);
  }

  // Address text wrapping
  const addr = order.shipping_address;
  let addressStr = "Self Outlet Pickup";
  if (addr && addr.id === 'pickup') {
    addressStr = `Store Pickup: ${addr.pickup_store === 'taleti' ? 'Taleti Road Branch' : 'Navagadh Main Branch'}, Palitana`;
  } else if (addr && addr.street) {
    addressStr = `${addr.street}, ${addr.landmark ? addr.landmark + ', ' : ''}${addr.city}, ${addr.state} - ${addr.pincode}`;
  }
  const splitAddress = doc.splitTextToSize(`Address: ${addressStr}`, pageWidth / 2 - margin - 5);
  doc.text(splitAddress, rightColX, 73);

  // 3. Products Table
  const tableColumn = ["Item Description", "Qty", "Weight / Option", "Unit Price", "Total Price"];
  const tableRows: any[] = [];

  const items = order.order_items || [];
  items.forEach((item: any) => {
    tableRows.push([
      item.product_name,
      item.quantity,
      item.weight || "Standard",
      `Rs ${Number(item.price).toFixed(2)}`,
      `Rs ${(Number(item.price) * Number(item.quantity)).toFixed(2)}`
    ]);
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 85,
    theme: "striped",
    styles: { fontSize: 8.5, cellPadding: 3, textColor: [31, 30, 28] },
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { halign: "center", cellWidth: 15 },
      2: { halign: "center", cellWidth: 35 },
      3: { halign: "right", cellWidth: 25 },
      4: { halign: "right", cellWidth: 25 }
    }
  });

  // Calculate pricing summary details
  const finalY = (doc as any).lastAutoTable.finalY + 8;
  const summaryX = pageWidth - margin - 65;

  const subtotal = Number(order.subtotal || 0);
  const discount = Number(order.discount || 0);
  const delivery = Number(order.delivery_charge || 0);
  const total = Number(order.total || 0);

  // Calculate GST 18% inclusive of sweets
  const taxableAmount = total / 1.18;
  const gstAmount = total - taxableAmount;

  // Add borders and summary card
  doc.setFillColor(lightBeige[0], lightBeige[1], lightBeige[2]);
  doc.rect(summaryX - 5, finalY - 5, 75, 45, "F");

  doc.setFontSize(8.5);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(80, 80, 80);

  doc.text("Subtotal:", summaryX, finalY);
  doc.text(`Rs ${subtotal.toFixed(2)}`, pageWidth - margin, finalY, { align: "right" });

  doc.text("Discounts:", summaryX, finalY + 6);
  doc.text(`-Rs ${discount.toFixed(2)}`, pageWidth - margin, finalY + 6, { align: "right" });

  doc.text("Delivery Charges:", summaryX, finalY + 12);
  doc.text(`Rs ${delivery.toFixed(2)}`, pageWidth - margin, finalY + 12, { align: "right" });

  doc.text("GST Included (18%):", summaryX, finalY + 18);
  doc.text(`Rs ${gstAmount.toFixed(2)}`, pageWidth - margin, finalY + 18, { align: "right" });

  // Grand Total separator
  doc.setDrawColor(goldColor[0], goldColor[1], goldColor[2]);
  doc.line(summaryX, finalY + 23, pageWidth - margin, finalY + 23);

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Grand Total:", summaryX, finalY + 29);
  doc.text(`Rs ${total.toFixed(2)}`, pageWidth - margin, finalY + 29, { align: "right" });

  // Payment Details (Left side of summary)
  const detailsY = finalY;
  doc.setFontSize(8.5);
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("PAYMENT DETAILS", margin, detailsY);

  doc.setFont("Helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(`Method: ${order.payment_method || "Online"}`, margin, detailsY + 6);
  doc.text(`Status: ${order.payment_status || "Completed"}`, margin, detailsY + 12);
  if (order.payment_id) {
    doc.text(`Txn ID: ${order.payment_id}`, margin, detailsY + 18);
  }

  // 4. Footer Section
  const footerY = pageHeight - 35;
  doc.setDrawColor(goldColor[0], goldColor[1], goldColor[2]);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Thank you for shopping at Mehta Dairy!", pageWidth / 2, footerY + 8, { align: "center" });

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text("This is a computer-generated invoice and does not require a physical signature.", pageWidth / 2, footerY + 14, { align: "center" });
  doc.text("For support, please contact help@mehtasweetmart.com or call our helpline.", pageWidth / 2, footerY + 18, { align: "center" });

  return doc;
}

/**
 * Core service to generate, save, upload, and email invoices for an order
 */
export async function createInvoice(orderId: string): Promise<InvoiceData | null> {
  try {
    // 1. Check if invoice already exists
    const { data: existing } = await supabase
      .from("invoices")
      .select("*")
      .eq("order_id", orderId)
      .maybeSingle();

    if (existing) {
      console.log(`Invoice already exists for order ${orderId}: ${existing.invoice_number}`);
      return existing as InvoiceData;
    }

    // 2. Fetch order complete details with items
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError || !order) {
      throw new Error(`Order not found or database error: ${orderError?.message || "unknown"}`);
    }

    // 3. Generate unique invoice number format: MD-YYYY-0001
    const currentYear = new Date().getFullYear();
    const { count } = await supabase
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .gte("created_at", `${currentYear}-01-01T00:00:00Z`)
      .lt("created_at", `${currentYear + 1}-01-01T00:00:00Z`);

    const seq = (count || 0) + 1;
    const seqStr = String(seq).padStart(4, "0");
    const invoiceNumber = `MD-${currentYear}-${seqStr}`;

    // Attach temporary invoice metadata to order object for PDF draw
    const orderWithInvoice = {
      ...order,
      invoice_number: invoiceNumber,
      invoice_created_at: new Date().toISOString()
    };

    // 4. Generate PDF Document
    const doc = generateInvoicePDF(orderWithInvoice);
    const pdfArrayBuffer = doc.output("arraybuffer");
    const pdfBuffer = Buffer.from(pdfArrayBuffer);

    // 5. Upload PDF file to Supabase Storage
    const fileName = `${invoiceNumber}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("invoices")
      .upload(fileName, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Failed to upload PDF invoice to storage: ${uploadError.message}`);
    }

    // 6. Get Public URL
    const { data: publicUrlData } = supabase.storage
      .from("invoices")
      .getPublicUrl(fileName);

    const pdfUrl = publicUrlData.publicUrl;

    // 7. Fetch customer record if matching email/phone exists
    let customerId: string | null = null;
    if (order.user_phone) {
      const { data: cust } = await supabase
        .from("customers")
        .select("id")
        .eq("phone", order.user_phone)
        .maybeSingle();
      if (cust) customerId = cust.id;
    }

    // 8. Insert invoice record to public.invoices table
    const { data: newInvoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert([{
        invoice_number: invoiceNumber,
        order_id: orderId,
        customer_id: customerId,
        pdf_url: pdfUrl,
        metadata: {
          subtotal: order.subtotal,
          delivery_charge: order.delivery_charge,
          discount: order.discount,
          total: order.total,
          payment_method: order.payment_method,
          payment_status: order.payment_status,
          user_name: order.user_name,
          user_phone: order.user_phone,
          user_email: order.user_email
        }
      }])
      .select()
      .single();

    if (invoiceError) {
      throw new Error(`Failed to save invoice record: ${invoiceError.message}`);
    }

    console.log(`Invoice successfully created: ${invoiceNumber} for order ${order.order_number}`);

    // 9. Automatically trigger email delivery
    if (order.user_email) {
      // Execute asynchronously in background to not block the main process
      sendInvoiceEmail(newInvoice.id, order.user_email, pdfBuffer).catch(err => {
        console.error("Async email dispatch failed:", err);
      });
    }

    return newInvoice as InvoiceData;

  } catch (err) {
    console.error("Error in createInvoice service:", err);
    return null;
  }
}

/**
 * Send PDF invoice via Resend email service with attachments
 */
export async function sendInvoiceEmail(invoiceId: string, email: string, pdfBufferInput?: Buffer): Promise<boolean> {
  const logData: any = {
    invoice_id: invoiceId,
    customer_email: email,
    email_status: "pending",
    retry_count: 0
  };

  try {
    // 1. Fetch invoice info
    const { data: invoice } = await supabase
      .from("invoices")
      .select("*, orders(*)")
      .eq("id", invoiceId)
      .single();

    if (!invoice) {
      throw new Error(`Invoice ID ${invoiceId} not found`);
    }

    const order = invoice.orders;
    if (!order) {
      throw new Error(`Associated order for invoice ${invoiceId} not found`);
    }

    // 2. Fetch or load PDF buffer
    let pdfBuffer = pdfBufferInput;
    if (!pdfBuffer) {
      const fileName = `${invoice.invoice_number}.pdf`;
      const { data: downloadData, error: downloadError } = await supabase.storage
        .from("invoices")
        .download(fileName);

      if (downloadError || !downloadData) {
        throw new Error(`Failed to download PDF invoice from storage: ${downloadError?.message || "No data"}`);
      }

      const arrayBuffer = await downloadData.arrayBuffer();
      pdfBuffer = Buffer.from(arrayBuffer);
    }

    // 3. Dispatch email via Resend (or mock simulation if key is not set)
    let emailSent = false;
    let errorMsg: string | null = null;
    let resultId = "";

    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_mock_key') {
      console.log(`[Email Mock Simulation] Sending Invoice ${invoice.invoice_number} to ${email}`);
      emailSent = true;
      resultId = `mock_${Date.now()}`;
    } else {
      try {
        const emailHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #D46D2D; text-align: center;">Mehta Dairy Invoice</h2>
            <h3 style="text-align: center;">Thank You for Your Order!</h3>
            <p>Dear ${order.user_name || "Customer"},</p>
            <p>Your order has been confirmed. Please find your invoice <strong>${invoice.invoice_number}</strong> attached to this email.</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px;">
              <tr style="background-color: #f9f9f9;"><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Order Number:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${order.order_number}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Invoice Number:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${invoice.invoice_number}</td></tr>
              <tr style="background-color: #f9f9f9;"><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Grand Total:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; color: #D46D2D; font-weight: bold;">₹${Number(order.total).toFixed(2)}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Payment Method:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${order.payment_method}</td></tr>
            </table>
            <p style="text-align: center; color: #888; font-size: 11px;">Mehta Sweet Mart © 1952-2026. All rights reserved.</p>
          </div>
        `;

        const res = await resend.emails.send({
          from: `Mehta Sweet Mart <${SENDER_EMAIL}>`,
          to: email,
          subject: `Your Mehta Dairy Invoice - Order #${order.order_number}`,
          html: emailHtml,
          attachments: [
            {
              filename: `${invoice.invoice_number}.pdf`,
              content: pdfBuffer.toString("base64")
            }
          ]
        });

        if (res.error) {
          throw new Error(res.error.message);
        }

        emailSent = true;
        resultId = res.data?.id || "";
      } catch (sendError: any) {
        console.error("Resend API failed:", sendError);
        errorMsg = sendError.message || "Failed to dispatch email";
      }
    }

    // 4. Log status in Supabase table
    logData.email_sent = emailSent;
    logData.email_sent_at = emailSent ? new Date().toISOString() : null;
    logData.email_status = emailSent ? "sent" : "failed";
    logData.error_message = errorMsg;

    await supabase.from("invoice_email_logs").insert([logData]);

    return emailSent;

  } catch (err: any) {
    console.error("Error in sendInvoiceEmail service:", err);
    logData.email_sent = false;
    logData.email_status = "failed";
    logData.error_message = err.message || "Unknown error";

    // Log failure log in DB
    try {
      await supabase.from("invoice_email_logs").insert([logData]);
    } catch (dbErr) {
      console.error("Failed to insert failed invoice log:", dbErr);
    }
    return false;
  }
}

/**
 * Retry failed invoice email deliveries and increment retry_count
 */
export async function retryFailedInvoices(): Promise<number> {
  try {
    // 1. Fetch failed logs
    const { data: failedLogs } = await supabase
      .from("invoice_email_logs")
      .select("*")
      .eq("email_status", "failed")
      .lt("retry_count", 3); // Max 3 retries

    if (!failedLogs || failedLogs.length === 0) {
      return 0;
    }

    let retriedSuccessCount = 0;

    for (const log of failedLogs) {
      console.log(`Retrying invoice email for log ${log.id}, attempt ${log.retry_count + 1}...`);

      const success = await sendInvoiceEmail(log.invoice_id, log.customer_email);

      // Update retry_count on the log
      await supabase
        .from("invoice_email_logs")
        .update({
          retry_count: log.retry_count + 1,
          email_status: success ? "sent" : "failed",
          email_sent: success,
          email_sent_at: success ? new Date().toISOString() : null
        })
        .eq("id", log.id);

      if (success) retriedSuccessCount++;
    }

    return retriedSuccessCount;

  } catch (err) {
    console.error("Failed to execute retryFailedInvoices:", err);
    return 0;
  }
}
