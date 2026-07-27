import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { WhatsAppService } from '@/lib/services/whatsapp';
import { cookies } from 'next/headers';
import { verifyCustomerSession, verifySession } from '@/lib/auth-utils';

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();
    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    const { data: order, error } = await supabaseServer
      .from('orders')
      .select('*, order_items(*), invoices(*)')
      .eq('id', orderId)
      .maybeSingle();

    if (error || !order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
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

    // 2. Check if requester is the Customer who owns this order
    if (!isAuthorized) {
      const customerToken = cookieStore.get('mehta_customer_token')?.value;
      if (customerToken) {
        const customerPayload = await verifyCustomerSession(customerToken);
        if (customerPayload?.id && order.customer_id === customerPayload.id) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: 'Forbidden: Unauthorized access to this order.' }, { status: 403 });
    }

    const invoice = order.invoices && order.invoices.length > 0 ? order.invoices[0] : null;
    if (!invoice) {
      return NextResponse.json({ success: false, error: 'No invoice has been generated for this order yet' }, { status: 400 });
    }

    const cleanPhone = order.user_phone ? `91${order.user_phone.replace(/\D/g, '').slice(-10)}` : '';
    if (!cleanPhone) {
      return NextResponse.json({ success: false, error: 'Customer phone number is missing' }, { status: 400 });
    }

    const invoiceUrl = invoice.pdf_url || `https://mehtadairy.com/api/invoices/download?invoiceId=${order.id}`;
    const invoiceNumber = invoice.invoice_number;

    console.log(`[ResendWhatsApp] Triggering manual WhatsApp invoice delivery for ${order.order_number} to ${cleanPhone}`);
    
    const { sendWhatsAppInvoiceWithRetry } = await import('@/lib/services/invoices');
    const result = await sendWhatsAppInvoiceWithRetry(
      cleanPhone,
      invoiceUrl,
      order.order_number,
      invoiceNumber,
      order.id,
      3,
      2000,
      true // forceBypassIdempotency = true for manual admin triggers
    );
    
    if (!result) {
      return NextResponse.json({ success: false, error: 'Failed to send WhatsApp message via AiSensy after retries' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'WhatsApp invoice resent successfully' });
  } catch (error: any) {
    console.error('[ResendWhatsAppInvoice] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
