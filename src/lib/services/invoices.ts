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

/**
 * Generate a luxury PDF invoice using HTML + Tailwind CSS + Playwright
 */
export async function generateInvoicePDF(order: any): Promise<Buffer> {
  // --- PRE-FETCH IMAGES ---
  const imageCache: Record<string, string> = {};
  let logoUrl = null;
  let qrBase64 = null;
  
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    const logoBuffer = fs.readFileSync(logoPath);
    logoUrl = "data:image/png;base64," + logoBuffer.toString("base64");
    imageCache["logo"] = logoUrl;
  } catch (error) {
    console.error("Failed to load invoice logo:", error);
  }

  try {
    const reorderUrl = `https://mehtadairy.com/reorder?id=${encodeURIComponent(order.invoice_number || order.order_number)}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(reorderUrl)}&color=1F1E1C&bgcolor=ffffff`;
    const qrRes = await fetch(qrUrl);
    const qrBuffer = await qrRes.arrayBuffer();
    const qrMime = qrRes.headers.get("content-type") || "image/png";
    qrBase64 = `data:${qrMime};base64,` + Buffer.from(qrBuffer).toString("base64");
  } catch (err) {
    console.error("Failed to generate QR", err);
  }

  const items = order.order_items || [];
  
  const mappedItems = items.map((item: any) => ({
    name: item.product_name,
    subtitle: "Premium Quality Sweet",
    weight: item.weight || "Standard",
    qty: item.quantity,
    price: Number(item.price),
    total: Number(item.price) * Number(item.quantity)
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
    qr: qrBase64 || undefined
  };

  // Render React component to HTML string using dynamic import for Next.js build compatibility
  const ReactDOMServer = await import('react-dom/server');
  const InvoiceTemplateHtml = (await import('@/components/invoice-html/InvoiceTemplate')).default;
  const htmlString = '<!DOCTYPE html>' + ReactDOMServer.renderToStaticMarkup(
    React.createElement(InvoiceTemplateHtml, {
      invoice: mappedInvoiceData
    })
  );

  // Launch Playwright headless browser
  let browser;
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    // Vercel Serverless Environment (uses Sparticuz Chromium)
    const chromium = (await import('@sparticuz/chromium-min')).default;
    const { chromium: playwrightCore } = await import('playwright-core');
    browser = await playwrightCore.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath('https://github.com/Sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar'),
      headless: true,
    });
  } else {
    // Local Development
    const { chromium: playwright } = await import('playwright');
    browser = await playwright.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
    });
  }
  
  const page = await browser.newPage();
  await page.setContent(htmlString, { waitUntil: 'networkidle' });
  
  // Wait a little extra time for custom fonts (Outfit/Playfair Display) to definitely render
  await page.waitForTimeout(500);

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });

  await browser.close();

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

    const fileName = `${invoiceNumber}.pdf`;
    const { error: uploadError } = await supabase.storage.from("invoices").upload(fileName, pdfBuffer, { contentType: "application/pdf", upsert: true });
    if (uploadError) throw new Error(`Upload error`);

    const { data: publicUrlData } = supabase.storage.from("invoices").getPublicUrl(fileName);
    const pdfUrl = publicUrlData.publicUrl;

    let customerId: string | null = null;
    if (order.user_phone) {
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
      const { data: invoice } = await supabase.from("invoices").select("invoice_number").eq("id", invoiceId).single();
      if (!invoice) throw new Error(`Invoice not found`);
      const fileName = `${invoice.invoice_number}.pdf`;
      const { data: downloadData } = await supabase.storage.from("invoices").download(fileName);
      if (!downloadData) throw new Error(`No PDF data found in storage`);
      pdfBuffer = Buffer.from(await downloadData.arrayBuffer());
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
