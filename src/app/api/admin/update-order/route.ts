import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { OrderStatusNotificationService } from '@/lib/services/order-status-notifications';

export async function POST(request: Request) {
  try {
    const { orderId, newStatus, paymentStatus } = await request.json();

    if (!orderId || !newStatus) {
      return NextResponse.json({ error: 'Missing orderId or newStatus' }, { status: 400 });
    }

    // 1. Update the order status
    const updatePayload: any = { status: newStatus };
    if (paymentStatus) {
      updatePayload.payment_status = paymentStatus;
    }

    const { error: orderError } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId);

    if (orderError) throw orderError;

    // 2. Insert notification log for admin action
    await supabase.from('notifications').insert([{
      title: 'Order Status Update',
      message: `Order #${orderId.substring(0, 8)} status changed to ${newStatus} by Admin.`,
      type: 'status_update',
      is_read: false
    }]);

    // 3. Dispatch WhatsApp Notification & Timeline Event
    OrderStatusNotificationService.handleStatusChange(orderId, newStatus, 'Admin').catch(console.error);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Admin order update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
