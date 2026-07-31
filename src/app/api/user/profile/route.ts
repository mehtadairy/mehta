import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { verifyCustomerSession } from '@/lib/auth-utils';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    let customerId = null;

    // 1. Check for custom JWT Cookie (OTP / Truecaller)
    const cookieStore = await cookies();
    const token = cookieStore.get('mehta_customer_token')?.value;
    if (token) {
      const payload = await verifyCustomerSession(token);
      if (payload?.id) {
        customerId = payload.id;
      }
    }

    // 2. Check for authenticated session (Google Auth via Supabase SSR)
    if (!customerId) {
      const authHeader = request.headers.get('Authorization');
      let user = null;
      if (authHeader) {
        const authToken = authHeader.replace('Bearer ', '');
        const { data } = await supabase.auth.getUser(authToken);
        user = data?.user;
      } else {
        // Try SSR cookie parsing
        const { data } = await supabase.auth.getUser();
        user = data?.user;
      }
      if (user) customerId = user.id;
    }

    if (!customerId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error } = await supabase.from('customers').select('id, name, full_name, email, phone, profile_image, avatar_url, role, auth_user_id').or(`id.eq.${customerId},auth_user_id.eq.${customerId}`).single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
      }
      console.error('Supabase fetch error:', error);
      return NextResponse.json({ success: false, message: 'Failed to fetch profile' }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile });

  } catch (error: any) {
    console.error('Error in GET /api/user/profile:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { name, newPhone, newEmail } = await request.json();

    let customerId = null;

    // 1. Check for custom JWT Cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('mehta_customer_token')?.value;
    if (token) {
      const payload = await verifyCustomerSession(token);
      if (payload?.id) {
        customerId = payload.id;
      }
    }

    // 2. Check for authenticated session (Google Auth via Supabase SSR)
    if (!customerId) {
      const authHeader = request.headers.get('Authorization');
      let user = null;
      if (authHeader) {
        const authToken = authHeader.replace('Bearer ', '');
        const { data } = await supabase.auth.getUser(authToken);
        user = data?.user;
      } else {
        const { data } = await supabase.auth.getUser();
        user = data?.user;
      }
      if (user) customerId = user.id;
    }

    if (!customerId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { data: existingCustomer, error: fetchError } = await supabase.from('customers').select('id, name, email, phone').or(`id.eq.${customerId},auth_user_id.eq.${customerId}`).single();
    
    if (fetchError || !existingCustomer) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const updatePayload: any = { name };
    if (newPhone) updatePayload.phone = newPhone;
    // Only allow updating email if it is currently not set or is 'null'
    if (newEmail !== undefined && (!existingCustomer.email || existingCustomer.email === 'null')) updatePayload.email = newEmail;

    const { data, error } = await supabase.from('customers').update(updatePayload).eq('id', existingCustomer.id).select().single();

    if (error) {
      console.error('Supabase update error:', error);
      if (error.code === '23505') {
        return NextResponse.json({ success: false, message: 'This phone number or email is already registered to another account.' }, { status: 409 });
      }
      return NextResponse.json({ success: false, message: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: data });

  } catch (error: any) {
    console.error('Error in PUT /api/user/profile:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

