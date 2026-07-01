import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import webpush from 'web-push';
import { BUSINESS } from '@/lib/businessConfig';

// Configuration
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:support@mehtadairy.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function POST(req: Request) {
  try {
    const { phone, title, body, url } = await req.json();

    if (!phone) {
      return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 });
    }

    // Fetch user push subscription
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('push_subscription')
      .eq('phone', phone)
      .single();

    if (fetchError || !customer || !customer.push_subscription) {
      return NextResponse.json({ success: false, error: 'No active push subscription found for this user' }, { status: 404 });
    }

    const payload = JSON.stringify({
      title: title || `${BUSINESS.shortName} Update`,
      body: body || 'You have a new notification.',
      url: url || '/account',
    });

    try {
      await webpush.sendNotification(customer.push_subscription, payload);
      return NextResponse.json({ success: true });
    } catch (pushErr: any) {
      console.error("WebPush Error:", pushErr);
      
      // If subscription is invalid (e.g. 410 Gone), remove it from DB
      if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
        await supabase
          .from('customers')
          .update({ push_subscription: null })
          .eq('phone', phone);
      }

      return NextResponse.json({ success: false, error: 'Failed to send push notification' }, { status: 500 });
    }

  } catch (err: any) {
    console.error('Send Notification Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
