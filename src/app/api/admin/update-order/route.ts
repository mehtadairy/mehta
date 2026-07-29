import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { OrderStatusNotificationService } from '@/lib/services/order-status-notifications';

import { verifySession } from '@/lib/auth-utils';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    // 🔒 Double-Check Admin Authorization
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('mehta_admin_token')?.value;
    const payload = adminToken ? await verifySession(adminToken) : null;
    if (!payload || payload.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

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

    // 4. If status is updated to Cancelled, queue POS cancellation slip
    if (newStatus === 'Cancelled') {
      try {
        const { data: fullOrder } = await supabase.from('orders').select('*, order_items(*)').eq('id', orderId).single();
        if (fullOrder) {
          const { PrintingService } = await import('@/lib/services/printing');
          await PrintingService.queueOrderCancellationPrint(fullOrder, 'Cancelled by Admin');
        }
      } catch (printErr) {
        console.warn("[AdminUpdateOrder] Cancellation print queue warning:", printErr);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Admin order update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
