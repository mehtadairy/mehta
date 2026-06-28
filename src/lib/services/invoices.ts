import { Resend } from "resend";
import { supabase } from "@/lib/supabaseClient";
import { BUSINESS } from "@/lib/businessConfig";
import fs from "fs";
import path from "path";
import React from "react";
// import removed

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

// Backend PDF Generation using React-PDF

export async function generateInvoicePDF(order: any): Promise<Buffer> {
  // --- PRE-FETCH IMAGES ---
  let logoUrl = undefined;
  
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      logoUrl = "data:image/png;base64," + logoBuffer.toString("base64");
    }
  } catch (error) {
    console.error("Failed to load invoice logo:", error);
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
  let addressString = "Store Pickup";
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
    qr: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://mehtadairy.com/track/${order.id}`
  };

  // Dynamically import React-PDF to avoid edge runtime issues
  const { renderToBuffer } = await import('@react-pdf/renderer');
  const InvoiceTemplate = (await import('@/components/invoice/InvoiceTemplate')).default;
  
  const pdfBuffer = await renderToBuffer(
    React.createElement(InvoiceTemplate, { invoice: mappedInvoiceData })
  );

  return pdfBuffer;
}

/**
 * Core service to generate, save, upload, and email invoices for an order
 */
export async function createInvoice(orderId: string): Promise<InvoiceData | null> {
  try {
    const { data: existing } = await supabase.from("invoices").select("*").eq("order_id", orderId).maybeSingle();
    // DEV ONLY: Delete old cached invoices manually from admin/database.
    // if (existing) return existing as InvoiceData;

    const { data: order, error: orderError } = await supabase.from("orders").select("*, order_items(*)").eq("id", orderId).maybeSingle();
    if (orderError || !order) throw new Error(`Order not found`);

    const currentYear = new Date().getFullYear();
    const { count } = await supabase.from("invoices").select("*", { count: "exact", head: true })
      .gte("created_at", `${currentYear}-01-01T00:00:00Z`).lt("created_at", `${currentYear + 1}-01-01T00:00:00Z`);

    const seqStr = String((count || 0) + 1).padStart(4, "0");
    const invoiceNumber = `INV-${currentYear}-${seqStr}`;

    const orderWithInvoice = { ...order, invoice_number: invoiceNumber, invoice_created_at: new Date().toISOString() };
    const pdfBuffer = await generateInvoicePDF(orderWithInvoice);
    const pdfUrl = `https://mehtadairy.com/invoice/${invoiceNumber}`;

    // Upload to Supabase Storage so it can be downloaded
    await supabase.storage.from('invoices').upload(`${invoiceNumber}.pdf`, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true
    });

    let customerId: string | null = order.customer_id || null;
    if (!customerId && order.user_phone) {
      const { data: cust } = await supabase.from("customers").select("id").eq("phone", order.user_phone).maybeSingle();
      if (cust) customerId = cust.id;
    }

    const { data: newInvoice, error: invoiceError } = await supabase.from("invoices").insert([{
        invoice_number: invoiceNumber, order_id: orderId, customer_id: customerId, pdf_url: pdfUrl,
        metadata: { subtotal: order.subtotal, delivery_charge: order.delivery_charge, discount: order.discount, total: order.total, payment_method: order.payment_method, payment_status: order.payment_status, user_name: order.user_name, user_phone: order.user_phone, user_email: order.user_email }
    }]).select().single();

    if (invoiceError) throw new Error(`DB err`);

    if (order.user_email) {
      sendInvoiceEmail(newInvoice.id, order.user_email, pdfBuffer).catch(err => console.error(err));
    }

    return newInvoice as InvoiceData;
  } catch (err) {
    console.error("createInvoice error:", err);
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
