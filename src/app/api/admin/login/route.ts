import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { signSession } from '@/lib/auth-utils';
import { emailSchema, passwordSchema, logRejectedSubmission } from '@/lib/security-validation';
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter';
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
    const clientIp = getClientIp(request);

    // 🔒 Rate Limit: Max 5 attempts per IP + email per minute
    const rateLimit = checkRateLimit(`admin_login_${clientIp}_${email}`, 5, 60000);
    if (!rateLimit.success) {
      logRejectedSubmission('/api/admin/login', 'Rate limit exceeded', { email, ip: clientIp });
      return NextResponse.json({ error: 'Too many login attempts. Please try again later.' }, { status: 429 });
    }

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
