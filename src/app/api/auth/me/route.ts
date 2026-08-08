import { NextResponse } from 'next/server';
import { supabaseServer as supabase, createSSRServerClient } from '@/lib/supabaseServer';
import { verifyCustomerSession } from '@/lib/auth-utils';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    let customerId: string | null = null;
    let authUser: any = null;
    
    const cookieStore = await cookies();

    // 1. Attempt to get authenticated session via Supabase SSR first
    try {
      const ssrClient = await createSSRServerClient();
      const { data: { user } } = await ssrClient.auth.getUser();
      if (user) {
        customerId = user.id;
        authUser = user;
      }
    } catch (err) {
      // Ignore SSR errors and fallback to JWT token
    }

    // 2. If no Supabase session, check for custom JWT Cookie
    if (!customerId) {
      const token = cookieStore.get('mehta_customer_token')?.value;
      if (token) {
        const payload = await verifyCustomerSession(token);
        if (payload?.id) {
          customerId = payload.id;
        }
      }
    }

    if (!customerId) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // 3. Query customers database table
    const { data: customer, error } = await supabase
      .from('customers')
      .select('id, name, email, email_verified, phone, profile_image')
      .or(`id.eq.${customerId},auth_user_id.eq.${customerId}`)
      .maybeSingle();

    if (customer) {
      return NextResponse.json({ 
        authenticated: true, 
        user: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          email_verified: customer.email_verified || false,
          phone: customer.phone,
          profile_image: customer.profile_image
        }
      });
    }

    // 4. If customer DB record not found but auth session IS valid,
    // NEVER return 401, as it creates an infinite redirect loop.
    return NextResponse.json({
      authenticated: true,
      user: {
        id: authUser?.id || customerId,
        name: authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || 'Customer',
        email: authUser?.email || null,
        phone: authUser?.phone || null,
        profile_image: authUser?.user_metadata?.avatar_url || null
      }
    });

  } catch (error: any) {
    console.error('[API /auth/me] Error:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
