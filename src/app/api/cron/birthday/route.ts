import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { WhatsAppService } from '@/lib/services/whatsapp';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    // In Supabase, assuming there's a profiles table with a dob (date of birth) column
    // This is a naive fetch for demo purposes. Real-world would use a postgres function or exact match if DOB is stored as string/date.
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('phone, dob')
      .not('dob', 'is', null);

    if (error) {
      // If table doesn't have DOB, gracefully fail
      console.log('Profiles table might not have dob column yet.');
      return NextResponse.json({ success: true, sent: 0, note: 'DOB not configured' });
    }

    let sent = 0;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    for (const profile of profiles || []) {
      if (profile.dob && profile.phone) {
        const dobDate = new Date(profile.dob);
        if (dobDate.getMonth() + 1 === currentMonth && dobDate.getDate() === currentDay) {
          const cleanPhone = profile.phone.replace(/\D/g, '');
          const toPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

          // Idempotency: skip if birthday wishes have already been sent to this number today
          const { data: existingLog } = await supabase
            .from('notification_logs')
            .select('id')
            .eq('phone', toPhone)
            .eq('event_name', 'birthday_wishes')
            .gte('created_at', startOfToday.toISOString())
            .limit(1)
            .maybeSingle();

          if (existingLog) {
            console.log(`[BirthdayCron] Birthday wishes already sent to ${toPhone} today. Skipping.`);
            continue;
          }

          await WhatsAppService.sendNotification('birthday_wishes', profile.phone, []);
          sent++;
        }
      }
    }

    return NextResponse.json({ success: true, sent });
  } catch (error: any) {
    console.error("Cron Birthday Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
