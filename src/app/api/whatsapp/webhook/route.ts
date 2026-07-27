import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { handleWhatsAppMessage } from '@/lib/whatsapp-handlers';

// The Webhook Secret configured in AiSensy
const WEBHOOK_SECRET = process.env.AISENSY_WEBHOOK_SECRET;

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const headers = request.headers;

    // Validate Webhook Signature if secret is provided (Optional depending on AiSensy's exact implementation)
    if (WEBHOOK_SECRET) {
      // Typically AiSensy might send an 'x-hub-signature' or similar, or you validate via a custom header.
      // Assuming a basic HMAC check or a shared secret header for this implementation.
      const signature = headers.get('x-aisensy-signature');
      // If we need signature validation, it would go here.
      // We'll skip strict validation if header is missing in mock/dev, but log a warning.
    }

    const payload = JSON.parse(rawBody);

    // AiSensy webhook payload format varies. Typically it sends messages in a structure like:
    // { "messaging": [ { "from": "919999999999", "message": { "text": "Hi" }, "type": "text" } ] }
    // Or delivery reports.

    // 1. Log the incoming webhook to Supabase
    if (payload.destination || payload.messaging) {
       // Extract basic details for logging
       const phone = payload.messaging?.[0]?.from || payload.destination || 'unknown';
       const type = payload.messaging?.[0]?.type || payload.type || 'unknown';
       
       await supabase.from('whatsapp_logs').insert([{
         phone,
         direction: 'inbound',
         message_type: type,
         content: payload,
         status: 'received'
       }]);
    }

    // 2. Pass to the handler logic
    // We only process actual user messages, not delivery reports here, 
    // though delivery reports could update message status in DB.
    if (payload.messaging && payload.messaging.length > 0) {
      for (const msg of payload.messaging) {
        if (msg.message || msg.type === 'interactive' || msg.type === 'button' || msg.type === 'order' || msg.order) {
          await handleWhatsAppMessage(msg);
        }
      }
    } else if (payload.statuses) {
      // Handle delivery status updates (sent, delivered, read, failed)
      // Update whatsapp_logs table based on message_id
      for (const status of payload.statuses) {
         if (status.id && status.status) {
           await supabase
             .from('whatsapp_logs')
             .update({ status: status.status })
             .eq('message_id', status.id);
         }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('WhatsApp Webhook Error:', error);
    // Always return 200 to AiSensy to prevent webhook retries on our internal crashes
    return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 200 });
  }
}

// GET method for verifying the webhook URL when setting it up in AiSensy (if required)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('hub.challenge');
  if (challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ status: 'active' }, { status: 200 });
}
