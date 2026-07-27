import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(request: Request) {
  try {
    const { headers } = request;
    const apiKey = process.env.PRINT_AGENT_API_KEY;
    const clientKey = headers.get('x-print-agent-key') || headers.get('X-Print-Agent-Key');

    if (!apiKey || clientKey !== apiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, printerName, printedBy, errorMessage, retries } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const { data: order } = await supabaseServer
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    console.error(`[PrintErrorAPI] Print failed for order ${order.order_number} on printer ${printerName}. Error: ${errorMessage}`);

    // 1. Update orders print status
    await supabaseServer
      .from('orders')
      .update({
        print_status: 'failed'
      })
      .eq('id', orderId);

    // 2. Insert failure entry in print_logs
    await supabaseServer
      .from('print_logs')
      .insert([{
        order_id: orderId,
        printer_name: printerName || 'Default Thermal',
        printed_by: printedBy || 'Agent',
        status: 'failed',
        retries: retries || 0,
        error_message: errorMessage || 'Unknown printer hardware error'
      }]);

    // 3. Log alert notifications for shop admins
    try {
      await supabaseServer.from('notifications').insert([{
        title: '⚠️ Print Failed',
        message: `Receipt print failed for order ${order.order_number} on ${printerName || 'printer'}: ${errorMessage || 'Hardware offline'}`,
        type: 'admin',
        order_id: orderId
      }]);
    } catch (notifErr) {
      console.error('[PrintErrorAPI] Alert dispatch failed:', notifErr);
    }

    return NextResponse.json({ success: true, message: 'Print error logged successfully' });

  } catch (error: any) {
    console.error('[PrintErrorAPI] Error logging print failure:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
