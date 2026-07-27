import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { WhatsAppService } from '@/lib/services/whatsapp';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const twoAndHalfHoursAgo = new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString();

    // Find orders delivered ~2 hours ago where we haven't asked for feedback yet
    const { data: timelineEvents, error } = await supabase
      .from('order_timeline_events')
      .select('order_id, created_at, orders(user_phone)')
      .eq('status', 'Delivered')
      .lte('created_at', twoHoursAgo)
      .gt('created_at', twoAndHalfHoursAgo);

    if (error) throw error;

    let sent = 0;
    for (const event of timelineEvents || []) {
      const order = event.orders as any;
      if (order && order.user_phone) {
        const cleanPhone = order.user_phone.replace(/\D/g, '');
        const toPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
        
        // Idempotency: skip if feedback has already been sent to this number
        const { data: existingLog } = await supabase
          .from('notification_logs')
          .select('id')
          .eq('phone', toPhone)
          .eq('event_name', 'feedback_request')
          .limit(1)
          .maybeSingle();

        if (existingLog) {
          console.log(`[FeedbackCron] Feedback request already sent to ${toPhone}. Skipping.`);
          continue;
        }

        // Send feedback request
        await WhatsAppService.sendNotification('feedback_request', order.user_phone, []);
        sent++;
      }
    }

    return NextResponse.json({ success: true, sent });
  } catch (error: any) {
    console.error("Cron Feedback Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
