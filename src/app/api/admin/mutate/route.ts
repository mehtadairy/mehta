import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { WhatsAppService } from '@/lib/services/whatsapp';

import { verifySession } from '@/lib/auth-utils';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    // 🔒 Double-Check Admin Authorization
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('mehta_admin_token')?.value;
    const authPayload = adminToken ? await verifySession(adminToken) : null;
    if (!authPayload || authPayload.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    const { table, action, payload, match } = await req.json();

    if (!table || !action) {
      return NextResponse.json({ error: 'Missing table or action' }, { status: 400 });
    }

    let query: any;
    
    if (action === 'delete') {
      query = supabaseServer.from(table).delete();
    } else if (action === 'insert') {
      query = supabaseServer.from(table).insert(payload).select();
    } else if (action === 'update') {
      query = supabaseServer.from(table).update(payload);
    } else {
      return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
    }

    if (match) {
      for (const [key, val] of Object.entries(match)) {
        query = query.eq(key, val);
      }
    }

    const { data, error } = await query;
    
    if (error) throw error;
    
    // Trigger WhatsApp Notifications for order status updates
    if (table === 'orders' && action === 'update' && payload.status && match?.id) {
      // Fetch the order to get the phone number
      const { data: orderData } = await supabaseServer.from('orders').select('phone_number, id').eq('id', match.id).single();
      
      if (orderData && orderData.phone_number) {
        let phone = orderData.phone_number;
        if (!phone.startsWith('91')) phone = `91${phone}`; // Ensure country code
        
        const shortId = orderData.id.split('-')[0].toUpperCase();
        
        if (payload.status === 'preparing') {
          await WhatsAppService.sendPreparing(phone, shortId);
        } else if (payload.status === 'packed') {
          await WhatsAppService.sendPacked(phone, shortId);
        } else if (payload.status === 'out_for_delivery') {
          await WhatsAppService.sendOutForDelivery(phone, shortId);
        } else if (payload.status === 'delivered') {
          await WhatsAppService.sendDelivered(phone, shortId);
          await WhatsAppService.sendFeedback(phone, shortId, `https://mehtadairy.com/feedback/${orderData.id}`);
        }
      }
    }

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error(`Admin Proxy Error [${table} ${action}]:`, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
