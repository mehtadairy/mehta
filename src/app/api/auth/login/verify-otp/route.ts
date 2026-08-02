import { NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/services/whatsapp-auth';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { getCustomerJWTSecret, getCustomerCookieOptions } from '@/lib/auth-utils';
import { phoneSchema, otpSchema, logRejectedSubmission } from '@/lib/security-validation';
import { z } from 'zod';

const loginVerifySchema = z.object({
  phone: phoneSchema,
  otp: otpSchema
});

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      logRejectedSubmission('/api/auth/login/verify-otp', 'Invalid JSON body');
      return NextResponse.json({ success: false, error: 'Invalid request payload' }, { status: 400 });
    }

    const validation = loginVerifySchema.safeParse(body);
    if (!validation.success) {
      logRejectedSubmission('/api/auth/login/verify-otp', 'Input validation failed', validation.error.format());
      return NextResponse.json({ success: false, error: 'Invalid phone number or OTP format' }, { status: 400 });
    }

    const { phone: cleanPhone, otp } = validation.data;

    // Verify OTP via whatsapp-auth service
    const verifyResult = await verifyOTP(cleanPhone, otp);

    if (!verifyResult.success) {
      logRejectedSubmission('/api/auth/login/verify-otp', 'OTP verification failed', { phone: cleanPhone });
      return NextResponse.json({ success: false, error: 'Invalid or expired OTP' }, { status: 400 });
    }

    // Check if customer exists
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('id, name, email, phone, role')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching customer:', fetchError);
      return NextResponse.json({ success: false, error: 'Database operation failed' }, { status: 500 });
    }

    // Login Flow Requirement: NEVER create a customer during Login.
    if (!customer) {
      logRejectedSubmission('/api/auth/login/verify-otp', 'Login attempt for non-existent account', { phone: cleanPhone });
      return NextResponse.json({ success: false, error: 'Incorrect email or password.' }, { status: 401 });
    }

    // Generate JWT using jose
    const secret = getCustomerJWTSecret();
    const token = await new SignJWT({
      sub: customer.id,
      id: customer.id,
      phone: customer.phone,
      role: customer.role
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRES_IN)
      .sign(secret);

    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful',
      isNewCustomer: false,
      customer
    });

    const cookieOptions = getCustomerCookieOptions(req.headers.get('host'));
    response.cookies.set('mehta_customer_token', token, cookieOptions);

    return response;

  } catch (error: any) {
    console.error('Verify OTP API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to verify OTP' }, { status: 500 });
  }
}
