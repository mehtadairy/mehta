import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find failed messages that haven't maxed out retries
    const { data: failedLogs, error } = await supabase
      .from('notification_logs')
      .select('*')
      .eq('status', 'failed')
      .lt('retry_count', 3) // Assuming max_retries is 3
      .limit(20); // Process in small batches

    if (error) throw error;

    let retried = 0;
    
    // We import this dynamically to avoid circular dependencies if any
    const { WhatsAppService } = await import('@/lib/services/whatsapp');

    for (const log of failedLogs || []) {
      // Re-dispatch using the stored payload
      const payload = log.payload;
      if (payload) {
        // We will call the private sendMessage through a public wrapper, or just use sendNotification again?
        // Actually, sendNotification takes eventName and params. 
        // Let's increment retry count and try to dispatch.
        
        await supabase
          .from('notification_logs')
          .update({ retry_count: log.retry_count + 1, status: 'pending' })
          .eq('id', log.id);

        // We can just call sendNotification again, but that would create a duplicate log.
        // For a robust system, we would expose a retry method in WhatsAppService.
        // For now, let's just use the generic notification (it will create a new log, which is fine for audit).
        const params = payload.templateParams || [];
        const media = payload.media ? payload.media.url : undefined;
        const filename = payload.media ? payload.media.filename : undefined;

        await WhatsAppService.sendNotification(log.event_name, log.phone, params, media, filename);
        
        // Mark the old log as processed
        await supabase
          .from('notification_logs')
          .update({ status: 'retried' })
          .eq('id', log.id);
          
        retried++;
      }
    }

    return NextResponse.json({ success: true, retried });
  } catch (error: any) {
    console.error("Cron Retry WhatsApp Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
