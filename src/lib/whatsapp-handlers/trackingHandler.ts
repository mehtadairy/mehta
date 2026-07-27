import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { WhatsAppService } from '../services/whatsapp';

export async function handleTrackingIntent(phone: string, text: string, session: any) {
  // If user says just 'Track', fetch their latest order
  let orderQuery = supabase
    .from('orders')
    .select('id, status, created_at, total_amount')
    .eq('phone_number', phone)
    .order('created_at', { ascending: false })
    .limit(1);

  const { data: orders } = await orderQuery;

  if (!orders || orders.length === 0) {
    await WhatsAppService.sendCustomMessage(phone, "We couldn't find any recent orders for your number. Reply 'Menu' to place a new order!");
    return;
  }

  const order = orders[0];
  const orderIdShort = order.id.split('-')[0].toUpperCase();
  const date = new Date(order.created_at).toLocaleDateString();

  let statusText = '';
  switch (order.status.toLowerCase()) {
    case 'pending': statusText = '🟡 Received & Pending'; break;
    case 'preparing': statusText = '🍳 Being Prepared'; break;
    case 'packed': statusText = '📦 Packed'; break;
    case 'ready': statusText = '🛍️ Ready for Dispatch'; break;
    case 'out_for_delivery': statusText = '🚚 Out for Delivery'; break;
    case 'delivered': statusText = '✅ Delivered'; break;
    case 'cancelled': statusText = '❌ Cancelled'; break;
    default: statusText = order.status;
  }

  const msg = `*Order Tracking*\n\nOrder ID: ${orderIdShort}\nDate: ${date}\nTotal: ₹${order.total_amount}\n\n*Current Status:* ${statusText}\n\nThank you for shopping with Mehta Dairy!`;
  
  await WhatsAppService.sendCustomMessage(phone, msg);
}
