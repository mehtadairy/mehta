import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { signSession } from '@/lib/auth-utils';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    let userPayload = null;

    // Hardcoded override for the requested admin credentials
    if (email === 'mehtadairyplt@gmail.com' && password === 'mehtadairyplt@gmail.com') {
      userPayload = { id: 'admin-bypass', email, name: 'Mehta Admin', role: 'super_admin' };
    } else {
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
      
      userPayload = { id: adminUser.id, email: adminUser.email, name: adminUser.name, role: 'super_admin' };
    }

    const token = await signSession(userPayload);
    
    const response = NextResponse.json({ user: userPayload });
    response.cookies.set('mehta_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 1 day
      path: '/'
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
