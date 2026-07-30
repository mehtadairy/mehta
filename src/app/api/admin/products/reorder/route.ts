import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { verifySession } from '@/lib/auth-utils';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('mehta_admin_token')?.value;
    const authPayload = adminToken ? await verifySession(adminToken) : null;
    if (!authPayload || authPayload.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

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
