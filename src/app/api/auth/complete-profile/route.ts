import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { cookies } from 'next/headers';
import { verifyCustomerSession } from '@/lib/auth-utils';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, email, phone, authData } = body;

    // Both phone and email are optional depending on flow
    if (!phone && !email) {
      return NextResponse.json({ success: false, error: 'Phone or email is required' }, { status: 400 });
    }

    let authUserId = null;
    let customerId = null;

    // 1. Check for custom JWT Cookie (OTP Login)
    const cookieStore = await cookies();
    const token = cookieStore.get('mehta_customer_token')?.value;
    if (token) {
      const payload = await verifyCustomerSession(token);
      if (payload?.id) {
        customerId = payload.id;
      }
    }

    // 2. Check for authenticated session (Google Auth)
    if (!customerId) {
      const authHeader = req.headers.get('Authorization');
      let user = null;
      if (authHeader) {
        const authToken = authHeader.replace('Bearer ', '');
        const { data } = await supabase.auth.getUser(authToken);
        user = data?.user;
      } else {
        const { data } = await supabase.auth.getUser();
        user = data?.user;
      }
      if (user) authUserId = user.id;
    }

    if (!customerId && !authUserId) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Must be logged in to complete profile.' }, { status: 401 });
    }

    if (authUserId) {
      // Flow 1: Google Auth user linking a phone number
      const { data: existingPhoneUser } = await supabase
        .from('customers')
        .select('id, auth_user_id, email, name')
        .eq('phone', phone)
        .maybeSingle();

      if (existingPhoneUser && existingPhoneUser.auth_user_id !== authUserId) {
        // Merge account
        await supabase.from('customers').delete().eq('auth_user_id', authUserId);

        const { error: mergeError } = await supabase
          .from('customers')
          .update({
            auth_user_id: authUserId,
            auth_provider: 'google',
            phone_verified: true,
            email: existingPhoneUser.email || email,
          })
          .eq('id', existingPhoneUser.id);

        if (mergeError) return NextResponse.json({ success: false, error: 'Failed to merge account' }, { status: 500 });
        return NextResponse.json({ success: true, message: 'Account merged successfully' });
      }

      const { error: updateError } = await supabase
        .from('customers')
        .update({ 
          phone: phone,
          phone_verified: true,
          auth_provider: 'google'
        })
        .eq('auth_user_id', authUserId);

      if (updateError) return NextResponse.json({ success: false, error: 'Failed to update customer record' }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (customerId) {
      // Flow 2: OTP user completing profile (Name, Email, etc.)
      const { name, address, pincode } = body;
      const updateData: any = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      
      const { error: profileError } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', customerId);

      if (profileError) return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Bad Request' }, { status: 400 });

  } catch (error: any) {
    console.error('Complete Profile Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
