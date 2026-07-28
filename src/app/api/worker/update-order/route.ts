import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

import { verifySession } from '@/lib/auth-utils';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    // 🔒 Double-Check Worker Authorization
    const cookieStore = await cookies();
    const workerToken = cookieStore.get('mehta_worker_token')?.value || cookieStore.get('mehta_admin_token')?.value;
    const payload = workerToken ? await verifySession(workerToken) : null;
    if (!payload || (!payload.employeeId && payload.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized: Worker access required' }, { status: 401 });
    }

    const { orderId, nextStatus, workerName } = await request.json();

    if (!orderId || !nextStatus) {
      return NextResponse.json({ error: 'Missing orderId or nextStatus' }, { status: 400 });
    }

    // 1. Update the order status
    const { error: orderError } = await supabaseServer
      .from('orders')
      .update({ status: nextStatus })
      .eq('id', orderId);

    if (orderError) throw orderError;

    // 2. Insert notification log for worker/admin
    await supabaseServer.from('notifications').insert([{
      title: 'Order Status Update',
      message: `Order #${orderId.substring(0, 8)} status changed to ${nextStatus} by worker ${workerName || 'Employee'}.`,
      type: 'status_update',
      is_read: false
    }]);

    // 3. Dispatch WhatsApp Notification & Timeline Event
    // We import here or at the top
    const { OrderStatusNotificationService } = await import('@/lib/services/order-status-notifications');
    // Fire and forget (don't await) so we don't slow down the worker response
    OrderStatusNotificationService.handleStatusChange(orderId, nextStatus, workerName).catch(console.error);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Worker order update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
