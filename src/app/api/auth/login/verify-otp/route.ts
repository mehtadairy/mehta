import { NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/services/whatsapp-auth';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { getCustomerJWTSecret, getCustomerCookieOptions } from '@/lib/auth-utils';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export async function POST(req: Request) {
  try {
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json({ success: false, error: 'Phone number and OTP are required' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, '');

    // Verify OTP via whatsapp-auth service
    const verifyResult = await verifyOTP(cleanPhone, otp);

    if (!verifyResult.success) {
      return NextResponse.json({ success: false, error: verifyResult.error || 'Invalid OTP' }, { status: 400 });
    }

    // Check if customer exists
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('id, name, email, phone, role')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching customer:', fetchError);
      return NextResponse.json({ success: false, error: `DB Error: ${fetchError.message}` }, { status: 500 });
    }

    // Login Flow Requirement: NEVER create a customer during Login.
    if (!customer) {
      return NextResponse.json({ success: false, error: 'No account found. Please sign up first.' }, { status: 404 });
    }

    // Generate JWT using jose
    const secret = getCustomerJWTSecret();
    const token = await new SignJWT({
      sub: customer.id,
      id: customer.id, // For backward compatibility
      phone: customer.phone,
      role: customer.role
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRES_IN)
      .sign(secret);

    console.log(`[AUTH-DEBUG] /api/auth/login/verify-otp - Generated token for customer ${customer.id}`);

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
