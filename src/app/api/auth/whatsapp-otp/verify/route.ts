import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import crypto from 'crypto';
import { SignJWT } from 'jose';
import { getCustomerJWTSecret, getCustomerCookieOptions } from '@/lib/auth-utils';

function hashOTP(phone: string, otp: string) {
  const secret = process.env.JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'default-secret';
  return crypto.createHmac('sha256', secret).update(`${phone}:${otp}`).digest('hex');
}

import { isMasterOtpValid } from '@/lib/master-otp';

export async function POST(request: Request) {
  try {
    const { phone, otp, intent = 'login', name, email } = await request.json();

    if (!phone || !otp) {
      return NextResponse.json({ success: false, error: 'Phone and OTP are required' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const waPhone = `91${cleanPhone}`;

    // Development-Only Master OTP check
    if (!isMasterOtpValid(otp)) {
      const hashedCode = hashOTP(waPhone, otp);

      // Verify OTP in DB
      const { data: otpRecord, error: otpError } = await supabase
        .from('otp_codes')
        .select('id, phone, hashed_code, verified, expires_at')
        .eq('phone', waPhone)
        .eq('hashed_code', hashedCode)
        .eq('verified', false)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (otpError || !otpRecord) {
        return NextResponse.json({ success: false, error: 'Invalid or expired OTP' }, { status: 400 });
      }

      // Mark OTP as verified
      await supabase.from('otp_codes').update({ verified: true }).eq('id', otpRecord.id);
    }

    // ----------------------------------------------------
    // PROCEED WITH AUTHENTICATION (Similar to sync-customer)
    // ----------------------------------------------------

    let { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('id, phone, full_name, email, is_blocked, addresses')
      .eq('phone', cleanPhone)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error("Supabase fetch error:", fetchError);
      return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
    }

    if (intent === 'login') {
      if (!customer) {
        return NextResponse.json({ success: false, error: 'Incorrect email or password.' }, { status: 401 });
      } else if (!customer.phone_verified) {
        await supabase.from('customers').update({ phone_verified: true }).eq('id', customer.id);
        customer.phone_verified = true;
      }
    } else if (intent === 'signup') {
      if (customer) {
        return NextResponse.json({ success: false, error: 'Registration failed. Please try again.' }, { status: 400 });
      }
      
      const { data: newCustomer, error: insertError } = await supabase
        .from('customers')
        .insert([{ 
          phone: cleanPhone, 
          name: name || null,
          email: email || null,
          phone_verified: true, 
          auth_provider: 'whatsapp' 
        }])
        .select()
        .single();

      if (insertError) {
        console.error("Supabase insert error:", insertError);
        return NextResponse.json({ success: false, error: 'Failed to create account.' }, { status: 500 });
      } else {
        customer = newCustomer;
      }
    } else {
      return NextResponse.json({ success: false, error: 'Invalid intent' }, { status: 400 });
    }

    // 🔒 Generate Secure JWT Token for Session
    const secret = getCustomerJWTSecret();
    const token = await new SignJWT({ 
      id: customer.id, 
      phone: customer.phone,
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
        email: customer.email
      }
    });

    // 🔒 Set HttpOnly Cookie
    const cookieOptions = getCustomerCookieOptions(req.headers.get('host'));
    response.cookies.set('mehta_customer_token', token, cookieOptions);

    return response;

  } catch (error) {
    console.error('Verify OTP Route Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
