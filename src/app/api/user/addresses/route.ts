import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const { phone, address } = await request.json();

    if (!phone || !address) {
      return NextResponse.json({ success: false, message: 'Phone and address are required' }, { status: 400 });
    }

    // Fetch current addresses
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('saved_addresses')
      .eq('phone', phone)
      .single();

    if (fetchError) {
      console.error('Supabase fetch error:', fetchError);
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const currentAddresses = profile.saved_addresses || [];
    const newAddresses = [...currentAddresses, address];

    // Update with new addresses
    const { data, error } = await supabase
      .from('profiles')
      .update({ saved_addresses: newAddresses })
      .eq('phone', phone)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json({ success: false, message: 'Failed to add address' }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: data });

  } catch (error: any) {
    console.error('Error in POST /api/user/addresses:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { phone, addressId } = await request.json();

    if (!phone || !addressId) {
      return NextResponse.json({ success: false, message: 'Phone and addressId are required' }, { status: 400 });
    }

    // Fetch current addresses
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('saved_addresses')
      .eq('phone', phone)
      .single();

    if (fetchError) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const currentAddresses = profile.saved_addresses || [];
    const newAddresses = currentAddresses.filter((a: any) => a.id !== addressId);

    // Update with new addresses
    const { data, error } = await supabase
      .from('profiles')
      .update({ saved_addresses: newAddresses })
      .eq('phone', phone)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, message: 'Failed to delete address' }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: data });

  } catch (error: any) {
    console.error('Error in DELETE /api/user/addresses:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
