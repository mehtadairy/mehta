import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    
    // Check for authenticated session (Google Auth)
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      supabase.auth.setSession({ access_token: authHeader.replace('Bearer ', ''), refresh_token: '' });
    }
    
    const { data: { user } } = await supabase.auth.getUser();

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

    // Check for authenticated session
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      supabase.auth.setSession({ access_token: authHeader.replace('Bearer ', ''), refresh_token: '' });
    }
    const { data: { user } } = await supabase.auth.getUser();

    if (!user && !phone) {
      return NextResponse.json({ success: false, message: 'Unauthorized or missing phone' }, { status: 400 });
    }

    const updatePayload: any = { name };
    if (newPhone) updatePayload.phone = newPhone;
    if (newEmail !== undefined) updatePayload.email = newEmail;

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

