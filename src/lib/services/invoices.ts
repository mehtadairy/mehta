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

// Backend PDF Generation has been removed in favor of client-side browser generation.

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

    // No backend PDF generation needed!
    // Simply insert metadata and email the link.
    const pdfUrl = `https://mehtadairy.com/invoice/${invoiceNumber}`;

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
      sendInvoiceEmail(newInvoice.id, order.user_email).catch(err => console.error(err));
    }

    return newInvoice as InvoiceData;
  } catch (err) {
    console.error("createInvoice error:", err);
    return null;
  }
}

export async function sendInvoiceEmail(invoiceId: string, email: string): Promise<boolean> {
  try {
    const { sendInvoiceEmailWithRetry } = await import('@/lib/email/sendInvoice');
    const { success } = await sendInvoiceEmailWithRetry(invoiceId, email);
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
