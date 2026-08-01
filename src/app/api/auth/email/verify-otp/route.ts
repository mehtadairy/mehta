import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { getCustomerJWTSecret, getCustomerCookieOptions } from '@/lib/auth-utils';
import { emailSchema, otpSchema, logRejectedSubmission } from '@/lib/security-validation';
import { z } from 'zod';

const emailVerifySchema = z.object({
  email: emailSchema,
  otp: otpSchema
});

const MAX_ATTEMPTS = 5;

// Helper to hash OTP
const hashOTP = (otp: string, email: string) => {
  const secret = process.env.JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-secret';
  return crypto.createHmac('sha256', secret)
               .update(otp + email)
               .digest('hex');
};

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body) {
      logRejectedSubmission('/api/auth/email/verify-otp', 'Invalid JSON payload');
      return NextResponse.json({ success: false, error: 'Invalid request payload' }, { status: 400 });
    }

    const validation = emailVerifySchema.safeParse(body);
    if (!validation.success) {
      logRejectedSubmission('/api/auth/email/verify-otp', 'Validation failed', validation.error.format());
      return NextResponse.json({ success: false, error: 'Invalid email or OTP format' }, { status: 400 });
    }

    const { email, otp } = validation.data;
    const emailLower = email.toLowerCase().trim();
    const otpHash = hashOTP(otp, emailLower);

    // 1. Fetch latest OTP for email
    const { data: otpRecord, error: fetchError } = await supabase
      .from('email_otps')
      .select('*')
      .eq('email', emailLower)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !otpRecord) {
      return NextResponse.json({ success: false, error: 'Invalid or expired OTP' }, { status: 400 });
    }

    if (otpRecord.used) {
      return NextResponse.json({ success: false, error: 'OTP has already been used' }, { status: 400 });
    }

    if (new Date() > new Date(otpRecord.expires_at)) {
      return NextResponse.json({ success: false, error: 'OTP has expired' }, { status: 400 });
    }

    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json({ success: false, error: 'Too many failed attempts. Please request a new OTP.' }, { status: 429 });
    }

    // 2. Verify Hash
    if (otpRecord.otp_hash !== otpHash) {
      // Increment attempts
      await supabase
        .from('email_otps')
        .update({ attempts: otpRecord.attempts + 1 })
        .eq('id', otpRecord.id);
        
      return NextResponse.json({ success: false, error: 'Invalid OTP' }, { status: 400 });
    }

    // 3. Mark as used
    await supabase
      .from('email_otps')
      .update({ used: true })
      .eq('id', otpRecord.id);

    // 4. Upsert Customer
    let { data: customer, error: customerFetchError } = await supabase
      .from('customers')
      .select('*')
      .eq('email', emailLower)
      .single();

    if (!customer) {
      // Create new customer
      const { data: newCustomer, error: insertError } = await supabase
        .from('customers')
        .insert([{ 
          email: emailLower,
          auth_provider: 'email_otp'
        }])
        .select()
        .single();

      if (insertError) {
        console.error("Failed to create customer:", insertError);
        return NextResponse.json({ success: false, error: 'Failed to create user account' }, { status: 500 });
      }
      customer = newCustomer;
    } else {
      // Ensure provider reflects active login method
      await supabase.from('customers').update({ auth_provider: 'email_otp' }).eq('id', customer.id);
    }

    // 5. Generate Secure Session Token
    const { SignJWT } = await import('jose');
    const secret = getCustomerJWTSecret();
    
    const token = await new SignJWT({ 
      id: customer.id, 
      email: customer.email,
      role: 'customer'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(secret);

    const response = NextResponse.json({ 
      success: true, 
      customer: {
        id: customer.id,
        phone: customer.phone,
        name: customer.name,
        email: customer.email,
        profile_image: customer.profile_image
      }
    });

    const cookieOptions = getCustomerCookieOptions(req.headers.get('host'));
    response.cookies.set('mehta_customer_token', token, cookieOptions);

    return response;

  } catch (error: any) {
    console.error('Error in verify-otp:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
