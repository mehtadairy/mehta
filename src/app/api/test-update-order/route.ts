import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  const { data: orders } = await supabase.from('orders').select('*').limit(1);
  if (!orders || orders.length === 0) return NextResponse.json({ error: 'No orders' });
  
  const order = orders[0];
  const { data, error } = await supabase.from('orders').update({
    status: 'Delivered'
  }).eq('id', order.id).select();

  return NextResponse.json({
    orderId: order.id,
    currentStatus: order.status,
    updateError: error,
    updateData: data
  });
}
