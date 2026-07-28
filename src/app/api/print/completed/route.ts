import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(request: Request) {
  try {
    const { headers } = request;
    const apiKey = (process.env.PRINT_AGENT_API_KEY || '').replace(/['"]/g, '').trim();
    const rawClientKey = headers.get('x-print-agent-key') || headers.get('X-Print-Agent-Key') || '';
    const cleanClientKey = rawClientKey.replace(/['"]/g, '').trim();

    if (!apiKey || cleanClientKey !== apiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, printerName, printedBy } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // 1. Fetch order details to log correctly
    const { data: order, error: fetchError } = await supabaseServer
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    console.log(`[PrintCompletedAPI] Marking order ${order.order_number} as printed by ${printedBy} on printer ${printerName}`);

    // 2. Update orders print status and advance step to 'Preparing' (unless already in advanced state)
    const advancedStatuses = ['Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
    const targetStatus = advancedStatuses.includes(order.status) ? order.status : 'Preparing';

    const { error: updateError } = await supabaseServer
      .from('orders')
      .update({
        printed: true,
        printed_at: new Date().toISOString(),
        printed_by: printedBy || 'Agent',
        print_status: 'printed',
        status: targetStatus
      })
      .eq('id', orderId);

    if (updateError) {
      throw updateError;
    }

    // 3. Log success entry in print_logs
    await supabaseServer
      .from('print_logs')
      .insert([{
        order_id: orderId,
        printer_name: printerName || 'Default Thermal',
        printed_by: printedBy || 'Agent',
        status: 'printed',
        retries: 0
      }]);

    // 4. Send Worker realtime notifications
    try {
      const itemsText = `Preparing started for order ${order.order_number}`;
      await supabaseServer.from('notifications').insert([
        {
          title: '🧁 Start Preparing',
          message: `${order.order_number} has been printed successfully to the kitchen!`,
          type: 'worker',
          order_id: orderId
        },
        {
          title: '🖨️ Order Printed',
          message: `Order receipt ${order.order_number} printed on ${printerName || 'shop printer'}.`,
          type: 'admin',
          order_id: orderId
        }
      ]);
    } catch (notifError) {
      console.error('[PrintCompletedAPI] Live notification dispatch failed:', notifError);
    }

    return NextResponse.json({ success: true, message: 'Print status completed successfully' });

  } catch (error: any) {
    console.error('[PrintCompletedAPI] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
