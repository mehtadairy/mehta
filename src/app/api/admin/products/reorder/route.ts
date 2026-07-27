import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';

export async function POST(request: Request) {
  try {
    const { items } = await request.json();

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Items array is required' }, { status: 400 });
    }

    // Process all updates in parallel
    const promises = items.map((item: { id: string, position: number }) => 
      supabase.from('products').update({ position: item.position }).eq('id', item.id)
    );

    await Promise.all(promises);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Reorder error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
