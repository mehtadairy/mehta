import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { WhatsAppService } from '@/lib/services/whatsapp';

export class OrderStatusNotificationService {
  /**
   * Handle an order status change and dispatch appropriate WhatsApp notifications.
   * Also creates a timeline event.
   * Designed to fail gracefully so it doesn't block the main order update loop.
   */
  static async handleStatusChange(orderId: string, newStatus: string, workerName?: string) {
    try {
      console.log(`[OrderStatusNotificationService] Processing status change to ${newStatus} for order ${orderId}`);
      
      // 1. Fetch Order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();

      if (orderError || !order) {
        console.warn(`[OrderStatusNotificationService] Order not found for ID ${orderId}`);
        return;
      }

      // 🔒 1.5 Duplicate Notification Prevention Check
      const { data: existingLog } = await supabase
        .from('notification_logs')
        .select('id')
        .eq('order_id', orderId)
        .eq('event_name', `order_status_${newStatus.toLowerCase().replace(/\s+/g, '_')}`)
        .eq('status', 'delivered')
        .limit(1)
        .maybeSingle();

      if (existingLog) {
        console.log(`[OrderStatusNotificationService] Notification for status ${newStatus} on order ${orderId} already sent. Skipping duplicate.`);
        return;
      }

      // 2. Determine Customer Phone
      const phone = order.user_phone ? `91${order.user_phone.replace(/\D/g, '').slice(-10)}` : null;
      
      // 3. Insert Timeline Event
      let description = '';
      switch(newStatus) {
        case 'Confirmed': description = 'Order placed successfully'; break;
        case 'Processing': description = 'We are preparing your sweets'; break;
        case 'Packed': description = 'Your order is packed and ready'; break;
        case 'Out for Delivery': description = 'Your order is out for delivery'; break;
        case 'Delivered': description = 'Your order has been delivered'; break;
        case 'Cancelled': description = 'Your order has been cancelled'; break;
        default: description = `Order status updated to ${newStatus}`;
      }

      const { error: timelineError } = await supabase
        .from('order_timeline_events')
        .insert([{
          order_id: orderId,
          status: newStatus,
          description: description
        }]);
        
      if (timelineError) {
        console.warn(`[OrderStatusNotificationService] Failed to insert timeline event:`, timelineError);
        // Continue anyway, don't fail the whole process
      }

      if (!phone) {
        console.warn(`[OrderStatusNotificationService] No valid phone number found for order ${orderId}`);
        return;
      }

      // 4. Dispatch WhatsApp Notification
      let success = false;
      let templateName = '';

      switch (newStatus) {
        case 'Processing':
          templateName = 'order_preparing';
          success = await WhatsAppService.sendPreparing(phone, order.order_number);
          break;
        case 'Packed':
          templateName = 'order_packed';
          success = await WhatsAppService.sendPacked(phone, order.order_number);
          break;
        case 'Out for Delivery':
          templateName = 'order_out_delivery';
          // Assuming we don't have agent details in the order, we pass generic placeholders or default values.
          // Or we can modify sendOutForDelivery in WhatsAppService to just pass the order number if we don't have agent details.
          success = await WhatsAppService.sendOutForDelivery(phone, order.order_number, "Delivery Agent", "Our Team");
          break;
        case 'Delivered':
          templateName = 'order_delivered';
          success = await WhatsAppService.sendDelivered(phone, order.order_number);
          break;
        case 'Cancelled':
          // Optional: Add sendCancelled if there's a template for it.
          // success = await WhatsAppService.sendCustomMessage(phone, `Your order ${order.order_number} has been cancelled.`);
          break;
      }

      // 5. Logging is now handled inside WhatsAppService centrally.

    } catch (error) {
      console.error("[OrderStatusNotificationService] Uncaught error handling status change:", error);
    }
  }
}
