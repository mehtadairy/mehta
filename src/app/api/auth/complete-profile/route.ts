import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, email, phone, authData } = body;

    if (!phone) {
      return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    // Check for authenticated session (Google Auth)
    const authHeader = req.headers.get('Authorization');
    let user = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data } = await supabase.auth.getUser(token);
      user = data?.user;
    }

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Must be logged in to complete profile.' }, { status: 401 });
    }

    // Check if the phone is already used by someone else
    const { data: existingPhoneUser, error: phoneError } = await supabase
      .from('customers')
      .select('id, auth_user_id, email, name')
      .eq('phone', phone)
      .maybeSingle();

    if (existingPhoneUser && existingPhoneUser.auth_user_id !== user.id) {
      // Merge account: this phone belongs to an older OTP-only account or another account.
      // We will link THIS Google user to the existing phone record.
      
      // First, delete the temporary customer record that Google login just created
      await supabase.from('customers').delete().eq('auth_user_id', user.id);

      // Now update the existing old account to be owned by this Google user
      const { error: mergeError } = await supabase
        .from('customers')
        .update({
          auth_user_id: user.id,
          auth_provider: 'google',
          phone_verified: true,
          email: existingPhoneUser.email || email, // preserve old email if they had one, else use Google
        })
        .eq('id', existingPhoneUser.id);

      if (mergeError) {
        console.error("Supabase merge error:", mergeError);
        return NextResponse.json({ success: false, error: 'Failed to merge account' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Account merged successfully' });
    }

    // Update the customer record using the secure auth_user_id (no merge needed)
    const { error: updateError } = await supabase
      .from('customers')
      .update({ 
        phone: phone,
        phone_verified: true,
        auth_provider: 'google'
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
