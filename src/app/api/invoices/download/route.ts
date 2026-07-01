import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';

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

    const fileName = `${invoice.invoice_number}.pdf`;

    // Download PDF data from Supabase storage invoices bucket
    const { data, error } = await supabase.storage
      .from('invoices')
      .download(fileName);

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
