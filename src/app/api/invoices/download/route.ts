import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { generateInvoicePDF } from '@/lib/services/invoices';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const invoiceId = searchParams.get('invoiceId') || searchParams.get('orderId');
    
    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID or Order ID is required' }, { status: 400 });
    }

    // 1. Fetch Order and items directly
    const { data: order } = await supabase
      .from('orders')
      .select('*, order_items(*), invoices(*)')
      .or(`id.eq.${invoiceId},order_number.eq.${invoiceId}`)
      .maybeSingle();

    if (!order) {
      // Fallback: check invoices table
      const { data: invoice } = await supabase
        .from('invoices')
        .select('*, order:orders(*, order_items(*))')
        .or(`id.eq.${invoiceId},invoice_number.eq.${invoiceId}`)
        .maybeSingle();

      if (!invoice || !invoice.order) {
        return NextResponse.json({ error: 'Order / Invoice record not found' }, { status: 404 });
      }

      const orderData = {
        ...invoice.order,
        invoice_number: invoice.invoice_number,
        invoice_created_at: invoice.created_at
      };

      const pdfBuffer = await generateInvoicePDF(orderData);
      const fileName = `${invoice.invoice_number || 'Invoice'}.pdf`;

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${fileName}"`,
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800'
        },
      });
    }

    // 2. Generate PDF dynamically on-demand (Zero Supabase Storage Bloat)
    const invoiceNumber = order.invoices?.[0]?.invoice_number || order.invoice_number || `INV-${order.order_number || order.id}`;
    const orderWithInvoice = {
      ...order,
      invoice_number: invoiceNumber,
      invoice_created_at: order.invoices?.[0]?.created_at || order.created_at
    };

    const pdfBuffer = await generateInvoicePDF(orderWithInvoice);
    const fileName = `${invoiceNumber}.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800'
      },
    });

  } catch (err: any) {
    console.error("Invoice streaming error:", err);
    return NextResponse.json({ error: err.message || 'Failed to stream invoice PDF' }, { status: 500 });
  }
}
