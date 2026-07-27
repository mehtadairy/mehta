import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { cookies } from 'next/headers';
import { verifyCustomerSession, verifySession } from '@/lib/auth-utils';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const invoiceId = searchParams.get('invoiceId');
    
    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    // Fetch invoice metadata
    const { data: invoice } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .maybeSingle();

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice record not found' }, { status: 404 });
    }

    // 🔒 Authorization check
    let isAuthorized = false;
    const cookieStore = await cookies();

    // 1. Check if requester is Admin
    const adminToken = cookieStore.get('mehta_admin_token')?.value;
    if (adminToken) {
      const adminPayload = await verifySession(adminToken);
      if (adminPayload?.role === 'super_admin') {
        isAuthorized = true;
      }
    }

    // 2. Check if requester is the Customer who owns this invoice
    if (!isAuthorized) {
      const customerToken = cookieStore.get('mehta_customer_token')?.value;
      if (customerToken) {
        const customerPayload = await verifyCustomerSession(customerToken);
        if (customerPayload?.id && invoice.customer_id === customerPayload.id) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to access this invoice.' }, { status: 403 });
    }

    const fileName = `${invoice.invoice_number}.pdf`;
    const createdAtDate = new Date(invoice.created_at);
    const YYYY = createdAtDate.getFullYear();
    const MM = String(createdAtDate.getMonth() + 1).padStart(2, "0");
    const storagePath = `${YYYY}/${MM}/${invoice.invoice_number}.pdf`;
    const fallbackPath = `${invoice.invoice_number}.pdf`;

    // Try downloading from the nested YYYY/MM path first, fallback to root path if missing
    let downloadResult = await supabase.storage
      .from('invoices')
      .download(storagePath);

    if (downloadResult.error) {
      console.log(`[InvoiceDownload] Nested path ${storagePath} failed: ${downloadResult.error.message}. Attempting root fallback.`);
      downloadResult = await supabase.storage
        .from('invoices')
        .download(fallbackPath);
    }

    const { data, error } = downloadResult;

    if (error || !data) {
      console.error("Storage download error:", error);
      return NextResponse.json({ error: 'Failed to download PDF invoice file from storage' }, { status: 500 });
    }

    const buffer = await data.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (err: any) {
    console.error("Invoice download API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
