import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { verifyCustomerSession } from '@/lib/auth-utils';
import { cookies } from 'next/headers';

async function getAuthenticatedCustomerId(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('mehta_customer_token')?.value;
  if (token) {
    const payload = await verifyCustomerSession(token);
    if (payload?.id) return payload.id;
  }
  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    const authToken = authHeader.replace('Bearer ', '');
    const { data } = await supabase.auth.getUser(authToken);
    if (data?.user) return data.user.id;
  } else {
    const { data } = await supabase.auth.getUser();
    if (data?.user) return data.user.id;
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json({ success: false, message: 'Address is required' }, { status: 400 });
    }

    const customerId = await getAuthenticatedCustomerId(request);
    if (!customerId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Fetch current customer
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .or(`id.eq.${customerId},auth_user_id.eq.${customerId}`)
      .single();

    if (fetchError) {
      console.error('Supabase fetch error:', fetchError);
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Note: The previous code updated `profiles`. Wait, `profiles` or `customers`?
    // Looking at the codebase, they used `profiles` table for addresses. Let's use customer.phone to link to profiles or just update profiles where id = customer.id or phone = customer.phone.
    // Assuming `profiles` table is linked by phone.
    const { data: profile, error: profileFetchError } = await supabase
      .from('profiles')
      .select('saved_addresses')
      .eq('phone', customer.phone)
      .single();

    const currentAddresses = profile?.saved_addresses || [];
    const newAddresses = [...currentAddresses, address];

    // Update with new addresses
    let updateQuery;
    if (profileFetchError) {
       // Insert if doesn't exist
       updateQuery = supabase.from('profiles').insert([{ phone: customer.phone, saved_addresses: newAddresses }]).select().single();
    } else {
       updateQuery = supabase.from('profiles').update({ saved_addresses: newAddresses }).eq('phone', customer.phone).select().single();
    }
    
    const { data, error } = await updateQuery;

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
    const { addressId } = await request.json();

    if (!addressId) {
      return NextResponse.json({ success: false, message: 'addressId is required' }, { status: 400 });
    }

    const customerId = await getAuthenticatedCustomerId(request);
    if (!customerId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .or(`id.eq.${customerId},auth_user_id.eq.${customerId}`)
      .single();

    if (fetchError) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Fetch current addresses
    const { data: profile, error: profileFetchError } = await supabase
      .from('profiles')
      .select('saved_addresses')
      .eq('phone', customer.phone)
      .single();

    if (profileFetchError || !profile) {
      return NextResponse.json({ success: false, message: 'Profile not found' }, { status: 404 });
    }

    const currentAddresses = profile.saved_addresses || [];
    const newAddresses = currentAddresses.filter((a: any) => a.id !== addressId);

    // Update with new addresses
    const { data, error } = await supabase
      .from('profiles')
      .update({ saved_addresses: newAddresses })
      .eq('phone', customer.phone)
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
