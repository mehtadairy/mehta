import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { verifyCustomerSession } from '@/lib/auth-utils';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    let customerId = null;

    // 1. Check for custom JWT Cookie
    const cookieStore = await cookies();
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
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const { data: customer, error } = await supabase.from('customers').select('id, name, email, phone, profile_image').or(`id.eq.${customerId},auth_user_id.eq.${customerId}`).single();

    if (error || !customer) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ 
      authenticated: true, 
      user: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        profile_image: customer.profile_image
      }
    });

  } catch (error: any) {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
