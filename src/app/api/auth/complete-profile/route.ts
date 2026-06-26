import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, email, phone, authData } = body;

    if (!phone) {
      return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 });
    }

    // Check for authenticated session (Google Auth)
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      supabase.auth.setSession({ access_token: authHeader.replace('Bearer ', ''), refresh_token: '' });
    }
    
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Must be logged in to complete profile.' }, { status: 401 });
    }

    // Since we are validating purely via MSG91 widget frontend callback, 
    // ideally, you would verify the JWT/Token provided by MSG91 here before trusting the phone number.
    
    // Check if the phone is already used by someone else
    const { data: existingPhoneUser, error: phoneError } = await supabase
      .from('customers')
      .select('id, auth_user_id')
      .eq('phone', phone)
      .maybeSingle();

    if (existingPhoneUser && existingPhoneUser.auth_user_id !== user.id) {
      // It's possible to merge accounts, or just throw an error.
      return NextResponse.json({ success: false, error: 'Phone number already registered to another account. Please use a different number.' }, { status: 400 });
    }

    // Update the customer record using the secure auth_user_id
    const { error: updateError } = await supabase
      .from('customers')
      .update({ 
        phone: phone,
        phone_verified: true,
        auth_provider: 'google' // They came from Google originally but are verifying phone now
      })
      .eq('auth_user_id', user.id);

    if (updateError) {
      console.error("Supabase update error:", updateError);
      return NextResponse.json({ success: false, error: 'Failed to update customer record' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Complete Profile Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
