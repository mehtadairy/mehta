import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { WhatsAppService } from '@/lib/services/whatsapp';

export async function GET(request: Request) {
  // Validate Cron Secret
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const twoAndHalfHoursAgo = new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString();

    // Find carts that were abandoned ~2 hours ago
    const { data: abandonedCarts, error } = await supabase
      .from('abandoned_carts')
      .select('*')
      .eq('status', 'abandoned')
      .lte('last_active', twoHoursAgo)
      .gt('last_active', twoAndHalfHoursAgo); // Process in a window so we don't double send

    if (error) throw error;

    let sent = 0;
    for (const cart of abandonedCarts || []) {
      if (cart.phone) {
        // We can pass cart items length or total to template if needed
        await WhatsAppService.sendNotification('abandoned_cart', cart.phone, []);
        
        // Mark as sent
        await supabase
          .from('abandoned_carts')
          .update({ status: 'reminded' })
          .eq('id', cart.id);
        
        sent++;
      }
    }

    return NextResponse.json({ success: true, sent });
  } catch (error: any) {
    console.error("Cron Abandoned Cart Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
