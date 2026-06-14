import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Hardcoded override for the requested admin credentials
    if (email === 'mehtadairyplt@gmail.com' && password === 'mehtadairyplt@gmail.com') {
      return NextResponse.json({ 
        user: { id: 'admin-bypass', email, name: 'Mehta Admin', role: 'super_admin' } 
      });
    }

    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !adminUser) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    // Default basic fallback for other users (if any)
    if (password !== 'admin123') { // Temporary simple check for other legacy admins
       return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    return NextResponse.json({ user: adminUser });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
