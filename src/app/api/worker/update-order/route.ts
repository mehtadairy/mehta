import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

import { verifySession } from '@/lib/auth-utils';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    // 🔒 Double-Check Worker Authorization
    const cookieStore = await cookies();
    const workerToken = cookieStore.get('mehta_worker_token')?.value;
    const payload = workerToken ? await verifySession(workerToken) : null;
    if (!payload || !payload.employeeId) {
      return NextResponse.json({ error: 'Unauthorized: Valid worker session required' }, { status: 401 });
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
    const { OrderStatusNotificationService } = await import('@/lib/services/order-status-notifications');
    OrderStatusNotificationService.handleStatusChange(orderId, nextStatus, workerName).catch(console.error);

    // 4. If status is updated to Cancelled, queue POS cancellation slip
    if (nextStatus === 'Cancelled') {
      try {
        const { data: fullOrder } = await supabaseServer.from('orders').select('*, order_items(*)').eq('id', orderId).single();
        if (fullOrder) {
          const { PrintingService } = await import('@/lib/services/printing');
          await PrintingService.queueOrderCancellationPrint(fullOrder, `Approved by Worker ${workerName || ''}`);
        }
      } catch (printErr) {
        console.warn("[WorkerUpdateOrder] Cancellation print queue warning:", printErr);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Worker order update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
