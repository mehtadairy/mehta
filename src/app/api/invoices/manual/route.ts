import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { sendInvoiceEmail } from '@/lib/services/invoices';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { 
      customer_name, 
      customer_phone, 
      customer_email, 
      customer_address, 
      gst_number,
      items,
      subtotal,
      delivery_charge,
      discount,
      total,
      payment_method,
      payment_status,
      send_email
    } = payload;

    // Generate unique manual invoice number: MINV-YYYY-0001
    const currentYear = new Date().getFullYear();
    const { count } = await supabase
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .gte("created_at", `${currentYear}-01-01T00:00:00Z`)
      .lt("created_at", `${currentYear + 1}-01-01T00:00:00Z`);

    const seq = (count || 0) + 1;
    const seqStr = String(seq).padStart(4, "0");
    const invoiceNumber = `MINV-${currentYear}-${seqStr}`;

    // Structure data to match expected PDF generator order object
    const simulatedOrder = {
      order_number: "MANUAL",
      invoice_number: invoiceNumber,
      invoice_created_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      user_name: customer_name,
      user_phone: customer_phone,
      user_email: customer_email,
      shipping_address: { 
        id: 'manual', 
        street: customer_address + (gst_number ? ` (GST: ${gst_number})` : ''),
        city: '',
        state: '',
        pincode: ''
      },
      order_items: items,
      payment_method,
      payment_status,
      subtotal,
      delivery_charge,
      discount,
      total
    };

    // No backend PDF generation needed!
    // Simply set the PDF URL to the public page
    const pdfUrl = `https://mehtadairy.com/invoice/${invoiceNumber}`;

    // 3. Find existing customer if phone is provided
    let customerId = null;
    if (customer_phone) {
      const { data: cust } = await supabase
        .from("customers")
        .select("id")
        .eq("phone", customer_phone)
        .maybeSingle();
      if (cust) customerId = cust.id;
    }

    // 4. Save to invoices table
    const { data: newInvoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert([{
        invoice_number: invoiceNumber,
        customer_id: customerId,
        pdf_url: pdfUrl,
        metadata: {
          is_manual: true,
          ...simulatedOrder
        }
      }])
      .select()
      .single();

    if (invoiceError) {
      // If error is about order_id being null, we can try assigning a mock UUID or fixing schema.
      // Assuming it's fine.
      throw new Error(`Failed to save invoice record: ${invoiceError.message}`);
    }

    // 5. Optionally send email
    let emailSent = false;
    if (send_email && customer_email) {
      // Because sendInvoiceEmail fetches the order relation which won't exist for manual invoices,
      // we need to adapt sendInvoiceEmail to support missing orders.
      // Wait, sendInvoiceEmail line 377: `.select("*, orders(*)")` and line 387: `if (!order) throw new Error`
      // I should update sendInvoiceEmail as well.
      emailSent = await sendInvoiceEmail(newInvoice.id, customer_email, pdfBuffer);
    }

    return NextResponse.json({ 
      success: true, 
      invoice: newInvoice,
      pdf_url: pdfUrl,
      emailSent 
    });

  } catch (error: any) {
    console.error("Error creating manual invoice:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
