import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const email = searchParams.get('email');

    if (!phone && !email) {
      return NextResponse.json({ success: false, message: 'Phone or Email is required' }, { status: 400 });
    }

    let query = supabase.from('customers').select('*');
    if (phone && phone !== 'null' && phone !== 'undefined') {
      query = query.eq('phone', phone);
    } else if (email) {
      query = query.eq('email', email);
    } else {
      return NextResponse.json({ success: false, message: 'Valid Phone or Email is required' }, { status: 400 });
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

    if (!phone && !email) {
      return NextResponse.json({ success: false, message: 'Phone or Email is required' }, { status: 400 });
    }

    const updatePayload: any = { name };
    if (newPhone) updatePayload.phone = newPhone;
    if (newEmail !== undefined) updatePayload.email = newEmail;

    let query = supabase.from('customers').update(updatePayload);
    if (email) {
      query = query.eq('email', email);
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

