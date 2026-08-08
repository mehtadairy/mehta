import { NextResponse } from 'next/server';
import { supabaseServer as supabase, createSSRServerClient } from '@/lib/supabaseServer';
import { verifyCustomerSession } from '@/lib/auth-utils';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    let customerId: string | null = null;
    let authUser: any = null;

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
      const ssrClient = await createSSRServerClient();
      const { data: { user } } = await ssrClient.auth.getUser();
      if (user) {
        customerId = user.id;
        authUser = user;
      }
    }

    if (!customerId) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // 3. Query customers database table
    const { data: customer, error } = await supabase
      .from('customers')
      .select('id, name, email, phone, profile_image')
      .or(`id.eq.${customerId},auth_user_id.eq.${customerId}`)
      .maybeSingle();

    if (customer) {
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
    }

    // If customer DB record not created yet, return authenticated state with authUser info
    if (authUser) {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: authUser.id,
          name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || 'Google User',
          email: authUser.email,
          phone: authUser.phone || null,
          profile_image: authUser.user_metadata?.avatar_url || null
        }
      });
    }

    return NextResponse.json({ authenticated: false }, { status: 401 });

  } catch (error: any) {
    console.error('[API /auth/me] Error:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
