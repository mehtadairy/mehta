import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { OrderStatusNotificationService } from '@/lib/services/order-status-notifications';
import { WhatsAppService } from '@/lib/services/whatsapp';

export async function POST(request: Request) {
  try {
    const { orderId, notificationType } = await request.json();

    if (!orderId || !notificationType) {
      return NextResponse.json({ error: 'Missing orderId or notificationType' }, { status: 400 });
    }

    const { data: order, error } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle();
    
    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const phone = order.user_phone ? `91${order.user_phone.replace(/\D/g, '').slice(-10)}` : null;

    if (!phone) {
      return NextResponse.json({ error: 'No phone number associated with this order' }, { status: 400 });
    }

    console.log(`[Admin Resend] Resending ${notificationType} to ${phone} for order ${orderId}`);

    // If it's a standard status notification, we can reuse the handleStatusChange
    // (though it would create another timeline event, which is fine, or we can just send the WA msg directly)
    if (['Processing', 'Packed', 'Out for Delivery', 'Delivered'].includes(notificationType)) {
      await OrderStatusNotificationService.handleStatusChange(orderId, notificationType, 'Admin (Resend)');
      return NextResponse.json({ success: true, message: `Notification ${notificationType} triggered successfully` });
    }
    
    // Custom admin triggers
    if (notificationType === 'Invoice') {
      let invoiceUrl = `https://mehtadairy.com/api/invoices/download?invoiceId=${order.id}`;
      let invoiceNumber = `INV-${new Date().getFullYear()}-RETRY`; 
      // Look up invoice
      const { data: inv } = await supabase.from('invoices').select('*').eq('order_id', order.id).maybeSingle();
      if (inv) {
        invoiceUrl = inv.pdf_url || invoiceUrl;
        invoiceNumber = inv.invoice_number;
      }
      
      const { sendWhatsAppInvoiceWithRetry } = await import('@/lib/services/invoices');
      const result = await sendWhatsAppInvoiceWithRetry(
        phone,
        invoiceUrl,
        order.order_number,
        invoiceNumber,
        order.id,
        3,
        2000,
        true // forceBypassIdempotency = true
      );
      
      if (!result) {
        return NextResponse.json({ error: 'Failed to send WhatsApp invoice via AiSensy after retries' }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: `Invoice notification triggered successfully` });
    }

    if (notificationType === 'PaymentSuccess') {
      await WhatsAppService.sendPaymentReceived(phone, order.payment_id || 'RETRY', order.total);
      await WhatsAppService.sendOrderConfirmation(phone, order.order_number, order.total);
      return NextResponse.json({ success: true, message: `Payment Success notification triggered successfully` });
    }

    return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
  } catch (err: any) {
    console.error("[Admin Resend] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
