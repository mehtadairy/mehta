import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    
    // Create a fresh client for this request to avoid global state contamination
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    // Check for authenticated session (Google Auth)
    const authHeader = request.headers.get('Authorization');
    let user = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data } = await supabase.auth.getUser(token);
      user = data?.user;
    }

    let query = supabase.from('customers').select('*');
    
    if (user) {
      // STRICT: If authenticated, only fetch their exact profile
      query = query.eq('auth_user_id', user.id);
    } else if (phone && phone !== 'null' && phone !== 'undefined') {
      // OTP Fallback
      query = query.eq('phone', phone);
    } else {
      return NextResponse.json({ success: false, message: 'Unauthorized or missing phone' }, { status: 400 });
    }

    const { data: profile, error } = await query.single();

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
    const { phone, email, name, newPhone, newEmail } = await request.json();

    // Create a fresh client for this request
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    // Check for authenticated session
    const authHeader = request.headers.get('Authorization');
    let user = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data } = await supabase.auth.getUser(token);
      user = data?.user;
    }

    if (!user && !phone) {
      return NextResponse.json({ success: false, message: 'Unauthorized or missing phone' }, { status: 400 });
    }

    let fetchQuery = supabase.from('customers').select('*');
    if (user) {
      fetchQuery = fetchQuery.eq('auth_user_id', user.id);
    } else {
      fetchQuery = fetchQuery.eq('phone', phone);
    }
    const { data: existingCustomer, error: fetchError } = await fetchQuery.single();
    
    if (fetchError || !existingCustomer) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const updatePayload: any = { name };
    // Only allow updating phone if it is currently not set
    if (newPhone && !existingCustomer.phone) updatePayload.phone = newPhone;
    // Only allow updating email if it is currently not set
    if (newEmail !== undefined && !existingCustomer.email) updatePayload.email = newEmail;

    let query = supabase.from('customers').update(updatePayload);
    
    if (user) {
      query = query.eq('auth_user_id', user.id);
    } else {
      query = query.eq('phone', phone);
    }

    const { data, error } = await query.select().single();

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json({ success: false, message: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: data });

  } catch (error: any) {
    console.error('Error in PUT /api/user/profile:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

