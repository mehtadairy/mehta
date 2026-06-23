import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function GET() {
  const tables = ['categories', 'banners', 'addresses', 'orders', 'order_items'];
  const schema: any = {};
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (!error) {
      schema[table] = data.length > 0 ? Object.keys(data[0]) : "No data";
    } else {
      schema[table] = error.message;
    }
  }
  return NextResponse.json(schema);
}
