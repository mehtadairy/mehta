import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const trackingId = searchParams.get('id');

    if (!trackingId) {
      return NextResponse.json({ error: 'Missing tracking ID' }, { status: 400 });
    }

    // Try to find order by order_number or tracking string (or just ID)
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .or(`order_number.eq.${trackingId},id.eq.${trackingId}`)
      .maybeSingle();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Fetch timeline events
    const { data: timelineEvents } = await supabase
      .from('order_timeline_events')
      .select('id, order_id, title, description, status, created_at')
      .eq('order_id', order.id)
      .order('created_at', { ascending: true });

    return NextResponse.json({
      order,
      timeline: timelineEvents || []
    });

  } catch (error: any) {
    console.error("Tracking fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
