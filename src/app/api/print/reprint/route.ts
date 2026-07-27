import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth-utils';

export async function POST(request: Request) {
  try {
    // 🔒 Authorization check: Only verified admin can reprint
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('mehta_admin_token')?.value;
    if (!adminToken) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const adminPayload = await verifySession(adminToken);
    if (!adminPayload || adminPayload.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { orderId } = await request.json();
    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    const { data: order, error: fetchErr } = await supabaseServer
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .maybeSingle();

    if (fetchErr || !order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    console.log(`[ReprintAPI] Re-queueing print request for order ${order.order_number}`);

    // Update order printed status back to false / pending
    const { error: updateErr } = await supabaseServer
      .from('orders')
      .update({
        printed: false,
        print_status: 'reprint',
        printed_at: null,
        printed_by: null
      })
      .eq('id', orderId);

    if (updateErr) throw updateErr;

    // Dispatch print jobs to print_jobs queue using PrintingService
    const { PrintingService } = await import('@/lib/services/printing');
    const branchId = (order.shipping_address as any)?.branch_id || 'Main';
    await PrintingService.queueOrderPrints(order, branchId, true);

    // Log admin manual notification log
    try {
      await supabaseServer.from('notifications').insert([{
        title: '🖨️ Reprint Queued',
        message: `Order receipt reprint queued for order ${order.order_number}`,
        type: 'admin',
        order_id: orderId
      }]);
    } catch (notifErr) {
      console.error('[ReprintAPI] Live log alert failed:', notifErr);
    }

    return NextResponse.json({ success: true, message: 'Reprint queued successfully' });

  } catch (error: any) {
    console.error('[ReprintAPI] Error re-queueing print:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
