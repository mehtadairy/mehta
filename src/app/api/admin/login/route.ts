import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { signSession } from '@/lib/auth-utils';
import { emailSchema, passwordSchema, logRejectedSubmission } from '@/lib/security-validation';
import { z } from 'zod';

const adminLoginSchema = z.object({
  email: emailSchema,
  password: passwordSchema
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body) {
      logRejectedSubmission('/api/admin/login', 'Invalid JSON body');
      return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
    }

    const validation = adminLoginSchema.safeParse(body);
    if (!validation.success) {
      logRejectedSubmission('/api/admin/login', 'Input validation failed', validation.error.format());
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const { email, password } = validation.data;

    let userPayload = null;

    // Hardcoded override for admin credentials
    if (email === 'mehtadairyplt@gmail.com' && password === 'mehtadairyplt@gmail.com') {
      userPayload = { id: 'admin-bypass', email, name: 'Mehta Admin', role: 'super_admin' };
    } else {
      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !adminUser) {
        logRejectedSubmission('/api/admin/login', 'Admin email not found', { email });
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      if (password !== 'admin123') {
         logRejectedSubmission('/api/admin/login', 'Incorrect password for admin user', { email });
         return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
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
    console.error('Admin login exception:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
