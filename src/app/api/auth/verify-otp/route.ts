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

    const cleanPhone = phone.replace(/\D/g, '');
    const mobile = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    // Verify OTP via whatsapp-auth service
    const verifyResult = await verifyOTP(cleanPhone, otp);

    if (!verifyResult.success) {
      return NextResponse.json({ success: false, error: verifyResult.error || 'Invalid OTP' }, { status: 400 });
    }

    // Check if customer exists
    let { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('id, name, email, phone, role')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching customer:', fetchError);
      return NextResponse.json({ success: false, error: `DB Error: ${fetchError.message}` }, { status: 500 });
    }

    let isNewCustomer = false;

    // Auto-create customer if they don't exist
    if (!customer) {
      isNewCustomer = true;
      const { data: newCustomer, error: insertError } = await supabase
        .from('customers')
        .insert([{ 
          phone: cleanPhone, 
          role: 'customer',
          name: name || null,
          email: email || null
        }])
        .select('id, name, email, phone, role')
        .single();

      if (insertError || !newCustomer) {
        console.error('Error creating customer:', insertError);
        return NextResponse.json({ success: false, error: `Insert DB Error: ${insertError?.message || 'Unknown'}` }, { status: 500 });
      }
      customer = newCustomer;
    } else if (name || email) {
      // If customer exists but they used the signup form to provide name/email, we can optionally update them
      // Or just ignore since they already exist. Let's ignore to prevent overwriting existing details with blanks.
    }

    // Generate JWT using jose
    const secret = getCustomerJWTSecret();
    const token = await new SignJWT({
      sub: customer.id,
      id: customer.id, // For backward compatibility with verifyCustomerSession
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
      isNewCustomer,
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

