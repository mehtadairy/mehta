import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { WhatsAppService } from '@/lib/services/whatsapp';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 30 days ago, covering a 1-day window
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);

    // Find orders created 30 days ago
    const { data: oldOrders, error } = await supabase
      .from('orders')
      .select('id, user_phone, order_items(product_name)')
      .lte('created_at', thirtyDaysAgo.toISOString())
      .gt('created_at', thirtyOneDaysAgo.toISOString());

    if (error) throw error;

    let sent = 0;
    for (const order of oldOrders || []) {
      if (order.user_phone) {
        const cleanPhone = order.user_phone.replace(/\D/g, '');
        const toPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

        // Idempotency: skip if reorder reminder has already been sent to this number
        const { data: existingLog } = await supabase
          .from('notification_logs')
          .select('id')
          .eq('phone', toPhone)
          .eq('event_name', 'reorder_reminder')
          .limit(1)
          .maybeSingle();

        if (existingLog) {
          console.log(`[ReorderCron] Reorder reminder already sent to ${toPhone}. Skipping.`);
          continue;
        }

        // Pick the first item name as a reminder
        const itemName = order.order_items?.[0]?.product_name || 'your favorite sweets';
        await WhatsAppService.sendNotification('reorder_reminder', order.user_phone, [itemName]);
        sent++;
      }
    }

    return NextResponse.json({ success: true, sent });
  } catch (error: any) {
    console.error("Cron Reorder Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
