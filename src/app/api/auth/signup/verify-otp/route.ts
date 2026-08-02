import { NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/services/whatsapp-auth';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { getCustomerJWTSecret, getCustomerCookieOptions } from '@/lib/auth-utils';
import { phoneSchema, otpSchema, nameSchema, emailSchema, logRejectedSubmission } from '@/lib/security-validation';
import { z } from 'zod';

const signupVerifySchema = z.object({
  phone: phoneSchema,
  otp: otpSchema,
  name: nameSchema,
  email: emailSchema.optional().nullable().or(z.literal(''))
});

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      logRejectedSubmission('/api/auth/signup/verify-otp', 'Invalid JSON payload');
      return NextResponse.json({ success: false, error: 'Invalid request payload' }, { status: 400 });
    }

    const validation = signupVerifySchema.safeParse(body);
    if (!validation.success) {
      logRejectedSubmission('/api/auth/signup/verify-otp', 'Input validation failed', validation.error.format());
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid request details. Please check full name, phone number, and OTP.' 
      }, { status: 400 });
    }

    const { phone: cleanPhone, otp, name, email } = validation.data;
    const cleanEmail = email && email.trim().length > 0 ? email.trim().toLowerCase() : null;

    // Verify OTP via whatsapp-auth service
    const verifyResult = await verifyOTP(cleanPhone, otp);

    if (!verifyResult.success) {
      logRejectedSubmission('/api/auth/signup/verify-otp', 'OTP verification failed', { phone: cleanPhone });
      return NextResponse.json({ success: false, error: 'Invalid or expired OTP' }, { status: 400 });
    }

    // Check if customer exists
    const { data: existingCustomer, error: fetchError } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching customer:', fetchError);
      return NextResponse.json({ success: false, error: 'Database operation failed' }, { status: 500 });
    }

    // Signup Flow Requirement: Mobile number must be unique. Prevent duplicate accounts.
    if (existingCustomer) {
      logRejectedSubmission('/api/auth/signup/verify-otp', 'Duplicate account attempt', { phone: cleanPhone });
      return NextResponse.json({ success: false, error: 'Registration failed. Please try again.' }, { status: 400 });
    }

    // Create the new customer
    const { data: newCustomer, error: insertError } = await supabase
      .from('customers')
      .insert([{ 
        phone: cleanPhone, 
        role: 'customer',
        name: name.trim(),
        email: cleanEmail
      }])
      .select('id, name, email, phone, role')
      .single();

    if (insertError || !newCustomer) {
      console.error('Error creating customer:', insertError);
      return NextResponse.json({ success: false, error: 'Failed to create customer account' }, { status: 500 });
    }

    // Generate JWT using jose
    const secret = getCustomerJWTSecret();
    const token = await new SignJWT({
      sub: newCustomer.id,
      id: newCustomer.id,
      phone: newCustomer.phone,
      role: newCustomer.role
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRES_IN)
      .sign(secret);

    const response = NextResponse.json({
      success: true,
      message: 'Registration successful',
      isNewCustomer: true,
      customer: newCustomer
    });

    const cookieOptions = getCustomerCookieOptions(req.headers.get('host'));
    response.cookies.set('mehta_customer_token', token, cookieOptions);

    return response;

  } catch (error: any) {
    console.error('Verify OTP API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to verify OTP' }, { status: 500 });
  }
}
