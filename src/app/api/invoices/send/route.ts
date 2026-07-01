import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { sendInvoiceEmail } from '@/lib/services/invoices';

export async function POST(req: Request) {
  try {
    const { invoiceId, email } = await req.json();

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    let targetEmail = email;

    // If no email was sent, lookup the associated order contact details
    if (!targetEmail) {
      const { data: invoice } = await supabase
        .from('invoices')
        .select('*, orders(*)')
        .eq('id', invoiceId)
        .maybeSingle();

      if (invoice && invoice.orders && invoice.orders.user_email) {
        targetEmail = invoice.orders.user_email;
      }
    }

    if (!targetEmail || targetEmail.trim() === '') {
      return NextResponse.json({ error: 'Recipient customer email address is required' }, { status: 400 });
    }

    console.log(`Triggering invoice email dispatch for invoice ${invoiceId} to ${targetEmail}`);
    const success = await sendInvoiceEmail(invoiceId, targetEmail);

    if (success) {
      return NextResponse.json({ success: true, message: 'Invoice sent successfully' });
    } else {
      return NextResponse.json({ success: false, error: 'Email dispatch failed' }, { status: 500 });
    }
  } catch (err: any) {
    console.error("Invoice send API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
