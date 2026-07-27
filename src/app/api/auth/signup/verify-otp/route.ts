import { NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/services/whatsapp-auth';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { getCustomerJWTSecret, getCustomerCookieOptions } from '@/lib/auth-utils';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export async function POST(req: Request) {
  try {
    const { phone, otp, name, email } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json({ success: false, error: 'Phone number and OTP are required' }, { status: 400 });
    }

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ success: false, error: 'Full name is required' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, '');

    // Verify OTP via whatsapp-auth service
    const verifyResult = await verifyOTP(cleanPhone, otp);

    if (!verifyResult.success) {
      return NextResponse.json({ success: false, error: verifyResult.error || 'Invalid OTP' }, { status: 400 });
    }

    // Check if customer exists
    const { data: existingCustomer, error: fetchError } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching customer:', fetchError);
      return NextResponse.json({ success: false, error: `DB Error: ${fetchError.message}` }, { status: 500 });
    }

    // Signup Flow Requirement: Mobile number must be unique. Prevent duplicate accounts.
    if (existingCustomer) {
      return NextResponse.json({ success: false, error: 'An account already exists with this mobile number. Please login.' }, { status: 400 });
    }

    // Create the new customer
    const { data: newCustomer, error: insertError } = await supabase
      .from('customers')
      .insert([{ 
        phone: cleanPhone, 
        role: 'customer',
        name: name.trim(),
        email: email ? email.trim() : null
      }])
      .select('id, name, email, phone, role')
      .single();

    if (insertError || !newCustomer) {
      console.error('Error creating customer:', insertError);
      return NextResponse.json({ success: false, error: `Insert DB Error: ${insertError?.message || 'Unknown'}` }, { status: 500 });
    }

    // Generate JWT using jose
    const secret = getCustomerJWTSecret();
    const token = await new SignJWT({
      sub: newCustomer.id,
      id: newCustomer.id, // For backward compatibility
      phone: newCustomer.phone,
      role: newCustomer.role
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRES_IN)
      .sign(secret);

    console.log(`[AUTH-DEBUG] /api/auth/signup/verify-otp - Generated token for customer ${newCustomer.id}`);

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
