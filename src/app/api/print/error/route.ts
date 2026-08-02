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

    const { jobId, orderId, printerName, printedBy, errorMessage, retries } = await request.json();
    if (!orderId && !jobId) {
      return NextResponse.json({ error: 'Order ID or Job ID is required' }, { status: 400 });
    }

    let targetOrderId = orderId;
    let order = null;

    if (targetOrderId) {
      const { data: fetchedOrder } = await supabaseServer
        .from('orders')
        .select('*')
        .eq('id', targetOrderId)
        .maybeSingle();
      order = fetchedOrder;
    }

    console.error(`[PrintErrorAPI] Print failed for order ${order?.order_number || targetOrderId} on printer ${printerName}. Error: ${errorMessage}`);

    // 1. Update orders print status
    if (targetOrderId) {
      await supabaseServer
        .from('orders')
        .update({
          print_status: 'failed'
        })
        .eq('id', targetOrderId);
    }

    // 2. Insert failure entry in print_logs
    await supabaseServer
      .from('print_logs')
      .insert([{
        order_id: targetOrderId,
        printer_name: printerName || 'Default Thermal',
        printed_by: printedBy || 'Agent',
        status: 'failed',
        retries: retries || 0,
        error_message: errorMessage || 'Unknown printer hardware error'
      }]);

    // 3. Update print_jobs table status to failed
    if (jobId) {
      await supabaseServer
        .from('print_jobs')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', jobId);
    } else if (targetOrderId) {
      await supabaseServer
        .from('print_jobs')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('order_id', targetOrderId)
        .eq('status', 'pending');
    }

    // 4. Log alert notifications for shop admins
    try {
      if (order) {
        await supabaseServer.from('notifications').insert([{
          title: '⚠️ Print Failed',
          message: `Receipt print failed for order ${order.order_number} on ${printerName || 'printer'}: ${errorMessage || 'Hardware offline'}`,
          type: 'admin',
          order_id: targetOrderId
        }]);
      }
    } catch (notifErr) {
      console.error('[PrintErrorAPI] Alert dispatch failed:', notifErr);
    }

    return NextResponse.json({ success: true, message: 'Print error logged successfully' });

  } catch (error: any) {
    console.error('[PrintErrorAPI] Error logging print failure:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
