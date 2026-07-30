import { Resend } from "resend";
import { supabaseServer as supabase } from "@/lib/supabaseServer";
import { BUSINESS } from "@/lib/businessConfig";
import { WhatsAppService } from "@/lib/services/whatsapp";
import fs from "fs";
import path from "path";
import React from "react";
// import removed

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'onboarding@resend.dev';

// Helper for phone normalization
function normalizeIndianPhoneNumber(phone: any): string | null {
  const str = String(phone || "").replace(/\D/g, "");
  if (str.length === 10) return "91" + str;
  if (str.length === 12 && str.startsWith("91")) return str;
  return null;
}

export interface InvoiceData {
  id: string;
  invoice_number: string;
  order_id: string;
  customer_id: string | null;
  pdf_url: string | null;
  created_at: string;
}

import QRCode from 'qrcode';

// --- IN-MEMORY ASSET CACHING ---
let cachedLogoDataUri: string | undefined = undefined;

function getCachedInvoiceLogo(): string | undefined {
  if (cachedLogoDataUri) return cachedLogoDataUri;
  try {
    const optLogoPath = path.join(process.cwd(), "public", "invoice-logo.png");
    const origLogoPath = path.join(process.cwd(), "public", "logo.png");
    const logoPath = fs.existsSync(optLogoPath) ? optLogoPath : origLogoPath;

    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      cachedLogoDataUri = "data:image/png;base64," + logoBuffer.toString("base64");
    }
  } catch (error) {
    console.error("Failed to load invoice logo:", error);
  }
  return cachedLogoDataUri;
}

// Backend PDF Generation using React-PDF

export async function generateInvoicePDF(order: any): Promise<Buffer> {
  // --- LOAD CACHED LOGO ---
  const logoUrl = getCachedInvoiceLogo();

  // --- GENERATE IN-MEMORY QR CODE (NO NETWORK HTTP REQUESTS) ---
  let qrDataUri: string | undefined = undefined;
  try {
    const trackingUrl = `https://mehtadairy.com/track/${order.id || order.order_number || ''}`;
    qrDataUri = await QRCode.toDataURL(trackingUrl, {
      width: 100,
      margin: 1,
      color: { dark: '#111827', light: '#FFFFFF' }
    });
  } catch (e) {
    console.warn("Failed to generate in-memory QR code:", e);
  }

  const items = order.order_items || [];
  const mappedItems = items.map((item: any) => ({
    name: item.product_name || item.name,
    subtitle: item.subtitle || "Premium Quality Sweet",
    weight: item.weight || "Standard",
    qty: item.quantity || item.qty,
    price: Number(item.price),
    total: Number(item.price) * Number(item.quantity || item.qty)
  }));

  const addr = order.shipping_address;
  let addressString = "Address Not Provided";
  if (addr && addr.street) {
    addressString = `${addr.street}, ${addr.city}, ${addr.state} - ${addr.pincode}`;
  } else if (addr && typeof addr === 'string') {
    addressString = addr;
  }

  const mappedInvoiceData = {
    invoiceNo: order.invoice_number,
    orderNo: order.order_number || "N/A",
    date: new Date(order.invoice_created_at || order.created_at).toLocaleDateString("en-GB", { day: 'numeric', month: 'long', year: 'numeric' }),
    customer: {
      name: order.user_name || "Valued Customer",
      phone: String(order.user_phone || "N/A").replace(/^\+?91\s*/, "").trim(),
      email: order.user_email || undefined,
      address: addressString,
    },
    items: mappedItems,
    subtotal: Number(order.subtotal || 0),
    delivery: Number(order.delivery_charge || 0),
    discount: Number(order.discount || 0),
    gst: order.metadata?.gst_number && order.metadata?.gst_enabled === true ? Number(order.total || 0) - (Number(order.total || 0) / 1.18) : 0,
    grandTotal: Number(order.total || 0),
    paymentMethod: order.payment_method || "Cash",
    paymentStatus: (order.payment_status || "COMPLETED").toUpperCase() as "PAID" | "UNPAID" | "PARTIAL",
    logo: logoUrl || undefined,
    qr: qrDataUri
  };

  // Dynamically import React-PDF to avoid edge runtime issues
  const { renderToBuffer } = await import('@react-pdf/renderer');
  const InvoiceTemplate = (await import('@/components/invoice/InvoiceTemplate')).default;
  
  const pdfBuffer = await renderToBuffer(
    React.createElement(InvoiceTemplate, { invoice: mappedInvoiceData })
  );

  return pdfBuffer;
}

export async function sendWhatsAppInvoiceWithRetry(
  phone: string,
  pdfUrl: string,
  orderNumber: string,
  invoiceNumber: string,
  orderId: string,
  retries = 3,
  delay = 2000,
  forceBypassIdempotency = false
): Promise<boolean> {
  // 1. Idempotency Check: if not forced, check if already sent
  if (!forceBypassIdempotency) {
    const { data: ord } = await supabase
      .from('orders')
      .select('invoice_sent')
      .eq('id', orderId)
      .maybeSingle();
    
    if (ord && ord.invoice_sent) {
      console.log(`[InvoiceService] WhatsApp invoice for order ${orderId} already marked as sent. Skipping.`);
      return true;
    }
  }

  let success = false;
  let lastError = 'Unknown error';
  let finalMessageId = '';

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[InvoiceService] WhatsApp invoice send attempt ${attempt} for ${invoiceNumber}`);
      
      const result = await WhatsAppService.sendInvoiceDocument(phone, pdfUrl, orderNumber, invoiceNumber);
      
      if (result && result.success) {
        success = true;
        finalMessageId = result.messageId || '';
        console.log(`[InvoiceService] WhatsApp invoice ${invoiceNumber} sent successfully. Msg ID: ${finalMessageId}`);
        break;
      } else {
        lastError = result?.error || 'AiSensy send unsuccessful';
        console.warn(`[InvoiceService] WhatsApp send attempt ${attempt} unsuccessful:`, lastError);
      }
    } catch (error: any) {
      lastError = error?.message || String(error);
      console.warn(`[InvoiceService] WhatsApp send attempt ${attempt} failed with exception:`, lastError);
    }
    
    if (attempt < retries) {
      // Exponential backoff: 2s, 4s, 8s
      const backoffDelay = delay * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, backoffDelay));
    }
  }

  // Log final status to whatsapp_notification_logs
  try {
    await supabase.from('whatsapp_notification_logs').insert([{
      order_id: orderId,
      phone: phone,
      notification_type: 'Invoice Delivery',
      status: success ? 'sent' : 'failed',
      error_message: success ? null : `Failed to dispatch invoice via WhatsApp after ${retries} retries: ${lastError}`
    }]);
  } catch (logErr) {
    console.error('[InvoiceService] Failed to log WhatsApp status to whatsapp_notification_logs:', logErr);
  }

  if (success) {
    // Save to database (orders and invoices tables)
    try {
      const now = new Date().toISOString();
      
      // Update orders table
      await supabase.from('orders').update({
        invoice_url: pdfUrl,
        invoice_sent: true,
        invoice_sent_at: now,
        whatsapp_message_id: finalMessageId
      }).eq('id', orderId);

      // Update invoices table
      await supabase.from('invoices').update({
        invoice_sent: true,
        invoice_sent_at: now,
        whatsapp_message_id: finalMessageId
      }).eq('order_id', orderId);

      console.log(`[InvoiceService] Saved WhatsApp tracking columns for order ${orderId}`);
    } catch (dbErr) {
      console.error('[InvoiceService] Failed to save WhatsApp tracking details in DB:', dbErr);
    }
  } else {
    // Notify admin
    try {
      await supabase.from('notifications').insert([{
        title: '🔴 WhatsApp Invoice Failed',
        message: `Failed to send WhatsApp invoice ${invoiceNumber} for order ${orderNumber} after 3 attempts. Error: ${lastError}`,
        type: 'admin',
        order_id: orderId
      }]);
      console.log(`[InvoiceService] Admin notification logged for failed invoice.`);
    } catch (notifErr) {
      console.error("[InvoiceService] Admin notification logging failed:", notifErr);
    }
  }

  return success;
}

/**
 * Core service to generate, save, upload, and email invoices for an order
 */
export async function createInvoice(orderId: string): Promise<InvoiceData | null> {
  console.log(`[InvoiceService] Generating invoice for orderId: ${orderId}`);
  try {
    const { data: existing } = await supabase.from("invoices").select("*").eq("order_id", orderId).maybeSingle();
    if (existing) {
      console.log(`[InvoiceService] Invoice already exists for order ${orderId}: ${existing.invoice_number}`);
      return existing as InvoiceData;
    }

    const { data: order, error: orderError } = await supabase.from("orders").select("*, order_items(*)").eq("id", orderId).maybeSingle();
    if (orderError || !order) throw new Error(`Order not found for ID: ${orderId}`);

    const currentYear = new Date().getFullYear();
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");
    const { count } = await supabase.from("invoices").select("*", { count: "exact", head: true })
      .gte("created_at", `${currentYear}-01-01T00:00:00Z`).lt("created_at", `${currentYear + 1}-01-01T00:00:00Z`);

    // 6-digit zero padding with safety check to avoid duplicates
    let seq = (count || 0) + 1;
    let seqStr = String(seq).padStart(6, "0");
    let invoiceNumber = `INV-${currentYear}-${seqStr}`;
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 100) {
      const { data: dup } = await supabase.from("invoices").select("id").eq("invoice_number", invoiceNumber).maybeSingle();
      if (!dup) {
        isUnique = true;
      } else {
        attempts++;
        seqStr = String(seq + attempts).padStart(6, "0");
        invoiceNumber = `INV-${currentYear}-${seqStr}`;
      }
    }
    console.log(`[InvoiceService] Assigned unique invoice number: ${invoiceNumber}`);

    const orderWithInvoice = { ...order, invoice_number: invoiceNumber, invoice_created_at: new Date().toISOString() };
    const pdfUrl = `/api/invoices/download?invoiceId=${orderId}`;
    console.log(`[InvoiceService] On-demand PDF streaming URL resolved: ${pdfUrl}`);

    let customerId: string | null = order.customer_id || null;
    if (!customerId && order.user_phone) {
      const { data: cust } = await supabase.from("customers").select("id").eq("phone", order.user_phone).maybeSingle();
      if (cust) customerId = cust.id;
    }

    // Insert invoice record
    const { data: newInvoice, error: invoiceError } = await supabase.from("invoices").insert([{
        invoice_number: invoiceNumber, order_id: orderId, customer_id: customerId, pdf_url: pdfUrl,
        metadata: { subtotal: order.subtotal, delivery_charge: order.delivery_charge, discount: order.discount, total: order.total, payment_method: order.payment_method, payment_status: order.payment_status, user_name: order.user_name, user_phone: order.user_phone, user_email: order.user_email }
    }]).select().single();

    if (invoiceError) {
      console.error("[InvoiceService] Database insert error for invoices table:", invoiceError);
      throw new Error(`DB err: ${invoiceError.message}`);
    }

    // Update orders table with invoice details & tracking states
    try {
      await supabase.from("orders").update({
        invoice_number: invoiceNumber,
        invoice_url: pdfUrl,
        invoice_generated: true
      }).eq("id", orderId);
      console.log(`[InvoiceService] Updated order ${orderId} with invoice details.`);
    } catch (updateErr) {
      console.warn("[InvoiceService] Non-blocking warning: Failed to update orders table tracking fields:", updateErr);
    }

    if (order.user_email) {
      console.log(`[InvoiceService] Queueing invoice email delivery to ${order.user_email}`);
      generateInvoicePDF(orderWithInvoice)
        .then(buffer => sendInvoiceEmail(newInvoice.id, order.user_email, buffer))
        .catch(err => console.error("[InvoiceService] Email delivery failure:", err));
    }

    if (order.user_phone) {
      const cleanPhone = normalizeIndianPhoneNumber(order.user_phone);
      if (cleanPhone) {
        console.log(`[InvoiceService] Queueing WhatsApp invoice document delivery to ${cleanPhone}`);
        sendWhatsAppInvoiceWithRetry(
          cleanPhone,
          pdfUrl,
          order.order_number || "N/A",
          invoiceNumber,
          orderId
        ).catch(err => console.error("[InvoiceService] WhatsApp delivery failure:", err));
      } else {
        console.warn(`[InvoiceService] Failed to normalize phone number "${order.user_phone}" for order ${orderId}. Skipping WhatsApp delivery.`);
      }
    }

    return newInvoice as InvoiceData;
  } catch (err) {
    console.error("[InvoiceService] createInvoice failed:", err);
    return null;
  }
}

export async function sendInvoiceEmail(invoiceId: string, email: string, pdfBufferInput?: Buffer): Promise<boolean> {
  try {
    const { sendInvoiceEmailWithRetry } = await import('@/lib/email/sendInvoice');
    let pdfBuffer = pdfBufferInput;
    if (!pdfBuffer) {
      // If we don't have the buffer (e.g., manual resend), we'd need to regenerate it or fetch it.
      // For now, if we don't have it, we just pass null/undefined, and let sendInvoice handle it.
    }
    const { success } = await sendInvoiceEmailWithRetry(invoiceId, email, pdfBuffer);
    return success;
  } catch (err: any) {
    console.error("sendInvoiceEmail error:", err);
    return false;
  }
}

// Keeping the interface for compatibility but shifting retry logic to the send function itself
export async function retryFailedInvoices(): Promise<number> {
  return 0; // The new system uses exponential backoff immediately instead of cron retries
}
