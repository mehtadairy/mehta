import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone');
  const email = searchParams.get('email');

  if (!phone) {
    return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 });
  }

  try {
    let query = supabase.from('customers').select('id, phone, email');
    
    if (email) {
      query = query.or(`phone.eq.${phone},email.eq.${email}`);
    } else {
      query = query.eq('phone', phone);
    }
    
    const { data: customers, error } = await query;

    if (error) {
      console.error("Supabase fetch error:", error);
      return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
    }

    if (customers && customers.length > 0) {
      const existsPhone = customers.some(c => c.phone === phone);
      const existsEmail = email ? customers.some(c => c.email === email) : false;
      
      return NextResponse.json({ 
        success: true, 
        exists: true, 
        existsPhone, 
        existsEmail 
      });
    }

    return NextResponse.json({ success: true, exists: false });
  } catch (error: any) {
    console.error('Check Account Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
