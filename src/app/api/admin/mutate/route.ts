import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  try {
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
    
    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error(`Admin Proxy Error [${table} ${action}]:`, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
