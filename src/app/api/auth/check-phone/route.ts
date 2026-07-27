import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone');

  if (!phone) {
    return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 });
  }

  try {
    const { data: customer, error } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', phone)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Supabase fetch error:", error);
      return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, exists: !!customer });
  } catch (error: any) {
    console.error('Check Phone Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
