import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { signSession } from '@/lib/auth-utils';
import { emailSchema, passwordSchema, logRejectedSubmission } from '@/lib/security-validation';
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter';
import { getAccountLockStatus, recordFailedAttempt, resetAccountLock } from '@/lib/account-lockout';
import { verifyPassword, needsRehash, hashPassword } from '@/lib/password-utils';
import { z } from 'zod';

const adminLoginSchema = z.object({
  email: emailSchema,
  password: passwordSchema
});

const UNIFIED_AUTH_ERROR = 'Incorrect email or password.';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body) {
      logRejectedSubmission('/api/admin/login', 'Invalid JSON body');
      return NextResponse.json({ error: UNIFIED_AUTH_ERROR }, { status: 400 });
    }

    const validation = adminLoginSchema.safeParse(body);
    if (!validation.success) {
      logRejectedSubmission('/api/admin/login', 'Input validation failed', validation.error.format());
      return NextResponse.json({ error: UNIFIED_AUTH_ERROR }, { status: 401 });
    }

    const { email, password } = validation.data;
    const clientIp = getClientIp(request);

    // 🔒 1. Account Lockout Check (Per-Account 15-Minute Lock)
    const lockStatus = getAccountLockStatus(email);
    if (lockStatus.isLocked) {
      logRejectedSubmission('/api/admin/login', 'Locked account login attempt', { email, ip: clientIp });
      return NextResponse.json({ error: UNIFIED_AUTH_ERROR }, { status: 401 });
    }

    // 🔒 2. IP Rate Limit: Max 5 attempts per IP + email per minute
    const rateLimit = checkRateLimit(`admin_login_${clientIp}_${email}`, 5, 60000);
    if (!rateLimit.success) {
      logRejectedSubmission('/api/admin/login', 'Rate limit exceeded', { email, ip: clientIp });
      return NextResponse.json({ error: UNIFIED_AUTH_ERROR }, { status: 429 });
    }

    let userPayload = null;

    // 🔒 Secure Bcrypt Verification for Admin Accounts
    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    const superAdminEmail = process.env.ADMIN_EMAIL || 'mehtadairyplt@gmail.com';
    const superAdminPassHash = process.env.ADMIN_PASSWORD_HASH || hashPassword(process.env.ADMIN_PASSWORD || 'mehtadairyplt@gmail.com');

    if (adminUser) {
      const storedHash = adminUser.password_hash || adminUser.password;
      const isValid = verifyPassword(password, storedHash);

      if (!isValid) {
        logRejectedSubmission('/api/admin/login', 'Incorrect password for admin account', { email });
        await recordFailedAttempt(email, email);
        return NextResponse.json({ error: UNIFIED_AUTH_ERROR }, { status: 401 });
      }

      // Automatic Migration: Rehash legacy hashes to Bcrypt Cost 12 automatically
      if (needsRehash(storedHash)) {
        const newHash = hashPassword(password);
        await supabase
          .from('admin_users')
          .update({ password_hash: newHash, updated_at: new Date().toISOString() })
          .eq('id', adminUser.id);
      }

      userPayload = { id: adminUser.id, email: adminUser.email, name: adminUser.name || 'Mehta Admin', role: 'super_admin' };
    } else if (email === superAdminEmail && verifyPassword(password, superAdminPassHash)) {
      userPayload = { id: 'admin-bypass', email, name: 'Mehta Admin', role: 'super_admin' };
    } else {
      logRejectedSubmission('/api/admin/login', 'Admin email not found', { email });
      await recordFailedAttempt(email, email);
      return NextResponse.json({ error: UNIFIED_AUTH_ERROR }, { status: 401 });
    }

    // Reset lockout counters on successful authentication
    resetAccountLock(email);

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
