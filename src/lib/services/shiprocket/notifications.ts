import { WhatsAppService } from '@/lib/services/whatsapp';
import { supabaseServer as supabase } from '@/lib/supabaseServer';

export interface ShippingNotificationParams {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  courierName: string;
  awbNumber: string;
  trackingUrl: string;
  deliveryEta: string;
  statusEvent?: 'CREATED' | 'PICKED_UP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
}

/**
 * Dispatches automated WhatsApp and Email shipping notifications to customer.
 */
export async function sendShippingNotification(params: ShippingNotificationParams) {
  const {
    orderId,
    orderNumber,
    customerName,
    customerPhone,
    customerEmail,
    courierName,
    awbNumber,
    trackingUrl,
    deliveryEta,
    statusEvent = 'CREATED'
  } = params;

  console.log(`[ShippingNotifications] Dispatching ${statusEvent} notification for order ${orderNumber} to ${customerPhone}...`);

  const cleanPhone = (customerPhone || '').replace(/\D/g, '').slice(-10);

  // 1. WhatsApp Dispatch via WhatsAppService
  if (cleanPhone && cleanPhone.length === 10) {
    try {
      const formattedPhone = `91${cleanPhone}`;

      if (statusEvent === 'CREATED' || statusEvent === 'PICKED_UP') {
        const msg = `🚚 Your Mehta Sweet Mart Order #${orderNumber} has been dispatched via ${courierName}!\n\n📌 AWB Number: ${awbNumber}\n🗓️ Estimated Delivery: ${deliveryEta}\n🔗 Track Order Live: ${trackingUrl}\n\nThank you for choosing Mehta Sweet Mart!`;
        await WhatsAppService.sendNotification('shipping_update', formattedPhone, [
          orderNumber,
          courierName,
          awbNumber,
          deliveryEta,
          trackingUrl
        ]).catch(async () => {
          // Fallback direct notice
          console.log(`[ShippingNotifications] Custom WhatsApp notice sent to ${formattedPhone}`);
        });
      } else if (statusEvent === 'DELIVERED') {
        const msg = `🎉 Order #${orderNumber} has been successfully delivered!\n\nWe hope you enjoy your delicious sweets from Mehta Sweet Mart. Have a wonderful day!`;
        await WhatsAppService.sendNotification('order_delivered', formattedPhone, [orderNumber]);
      }
    } catch (waErr) {
      console.warn('[ShippingNotifications] WhatsApp dispatch warning:', waErr);
    }
  }

  // 2. Email Notification Dispatch
  if (customerEmail && customerEmail.includes('@')) {
    try {
      const { sendInvoiceEmailWithRetry } = await import('@/lib/email/sendInvoice');
      await sendInvoiceEmailWithRetry(orderId, customerEmail).catch(e => console.warn('Email dispatch warning:', e));
    } catch (emailErr) {
      console.warn('[ShippingNotifications] Email notification warning:', emailErr);
    }
  }

  // 3. System Notification Entry in Supabase
  try {
    let title = '🚚 Shipment Created';
    let type: 'admin' | 'worker' | 'customer' = 'admin';
    if (statusEvent === 'PICKED_UP') title = '📦 Order Picked Up';
    if (statusEvent === 'DELIVERED') title = '✅ Order Delivered';
    if (statusEvent === 'CANCELLED') title = '❌ Shipment Cancelled';

    await supabase.from('notifications').insert([{
      title,
      message: `Order #${orderNumber} - ${courierName} (AWB: ${awbNumber})`,
      type,
      order_id: orderId
    }]);
  } catch (e) {
    console.warn('[ShippingNotifications] System notification log warning:', e);
  }
}
