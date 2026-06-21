import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, email, phone, authData } = body;

    if (!phone) {
      return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 });
    }

    if (!userId && !email) {
      return NextResponse.json({ success: false, error: 'User identifier is required' }, { status: 400 });
    }

    // Since we are validating purely via MSG91 widget frontend callback, 
    // ideally, you would verify the JWT/Token provided by MSG91 here before trusting the phone number.
    
    // Check if the phone is already used by someone else
    const { data: existingPhoneUser, error: phoneError } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', phone)
      .single();

    if (existingPhoneUser && existingPhoneUser.id !== userId) {
      // It's possible to merge accounts, or just throw an error.
      // For now, let's allow updating if it matches or throw if used by someone else.
      return NextResponse.json({ success: false, error: 'Phone number already registered to another account. Please use a different number.' }, { status: 400 });
    }

    // Update the customer record
    let updateQuery = supabase
      .from('customers')
      .update({ 
        phone: phone,
        phone_verified: true,
        auth_provider: 'google' // They came from Google originally but are verifying phone now
      });

    if (userId) {
      updateQuery = updateQuery.eq('id', userId);
    } else {
      updateQuery = updateQuery.eq('email', email);
    }

    const { error: updateError } = await updateQuery;

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
