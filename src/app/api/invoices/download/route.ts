import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { generateInvoicePDF } from '@/lib/services/invoices';

import { verifyCustomerSession, verifySession } from '@/lib/auth-utils';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const invoiceId = searchParams.get('invoiceId') || searchParams.get('orderId');
    
    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID or Order ID is required' }, { status: 400 });
    }

    // 🔒 Verify session for IDOR protection
    const cookieStore = await cookies();
    const customerToken = cookieStore.get('mehta_customer_token')?.value;
    const adminToken = cookieStore.get('mehta_admin_token')?.value || cookieStore.get('mehta_worker_token')?.value;

    let authenticatedUserId: string | null = null;
    let isStaff = false;

    if (adminToken) {
      const staffPayload = await verifySession(adminToken);
      if (staffPayload?.role === 'super_admin' || staffPayload?.employeeId) isStaff = true;
    }

    if (!isStaff && customerToken) {
      const custPayload = await verifyCustomerSession(customerToken);
      if (custPayload?.id) authenticatedUserId = custPayload.id;
    }

    // 1. Fetch Order and items directly
    const { data: order } = await supabase
      .from('orders')
      .select('*, order_items(*), invoices(*)')
      .or(`id.eq.${invoiceId},order_number.eq.${invoiceId}`)
      .maybeSingle();

    if (order && !isStaff) {
      const isOwner = (authenticatedUserId && order.customer_id === authenticatedUserId);
      if (!isOwner) {
        return NextResponse.json({ error: 'Unauthorized to download this invoice' }, { status: 403 });
      }
    }

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
          'Cache-Control': 'private, max-age=3600, must-revalidate'
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
        'Cache-Control': 'private, max-age=3600, must-revalidate'
      },
    });

  } catch (err: any) {
    console.error("Invoice streaming error:", err);
    return NextResponse.json({ error: err.message || 'Failed to stream invoice PDF' }, { status: 500 });
  }
}
