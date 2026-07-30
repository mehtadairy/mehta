import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { SignJWT } from 'jose';
import { getCustomerJWTSecret, getCustomerCookieOptions } from '@/lib/auth-utils';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, authData, intent = 'login', name, email } = body;

    if (!phone) {
      return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 });
    }
    
    // Check if customer exists in Supabase
    let { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', phone)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error("Supabase fetch error:", fetchError);
      return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
    }

    if (intent === 'login') {
      // For login, if customer doesn't exist, throw an error
      if (!customer) {
        return NextResponse.json({ success: false, error: 'Account not found. Please sign up.' }, { status: 404 });
      } else {
        // Update existing customer to mark phone as verified
        if (!customer.phone_verified) {
          const { error: updateError } = await supabase
            .from('customers')
            .update({ phone_verified: true })
            .eq('id', customer.id);
          if (!updateError) {
            customer.phone_verified = true;
          }
        }
      }
    } else if (intent === 'signup') {
      // For signup, if customer already exists, throw an error
      if (customer) {
        return NextResponse.json({ success: false, error: 'Account already exists. Please log in.' }, { status: 409 });
      }

      // If customer doesn't exist, create them with the provided name and email
      const { data: newCustomer, error: insertError } = await supabase
        .from('customers')
        .insert([{ 
          phone, 
          name: name || null,
          email: email || null,
          phone_verified: true, 
          auth_provider: 'otp' 
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

    // Create the response object
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

  } catch (error: any) {
    console.error('Customer Sync Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
