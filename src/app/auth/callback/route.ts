import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { syncGoogleUserOnServer, setCustomerSessionCookie } from './actions';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const redirect = searchParams.get('redirect') || searchParams.get('next') || '/account';

  // 1. Handle OAuth Provider Error
  if (error) {
    console.error('OAuth provider error in callback:', error);
    const loginErrorUrl = new URL('/login', origin);
    loginErrorUrl.searchParams.set('error', errorDescription || error);
    return NextResponse.redirect(loginErrorUrl);
  }

  // 2. Validate PKCE Authorization Code
  if (!code) {
    console.error('Missing authorization code in OAuth callback');
    const loginErrorUrl = new URL('/login', origin);
    loginErrorUrl.searchParams.set('error', 'Missing authorization code from login provider');
    return NextResponse.redirect(loginErrorUrl);
  }

  const cookieStore = await cookies();
  const targetRedirectUrl = new URL(redirect, origin);
  const response = NextResponse.redirect(targetRedirectUrl);

  // 3. Create Server-Side Supabase Client with @supabase/ssr
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // 4. Exchange PKCE authorization code for a session
  const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !exchangeData?.session?.user) {
    console.error('PKCE exchange error:', exchangeError?.message);
    const loginErrorUrl = new URL('/login', origin);
    loginErrorUrl.searchParams.set('error', 'Failed to complete Google authentication session exchange');
    return NextResponse.redirect(loginErrorUrl);
  }

  const user = exchangeData.session.user;
  const email = user.email || '';
  const name = user.user_metadata?.full_name || user.user_metadata?.name || 'Google User';

  if (email) {
    // 5. Sync or auto-create customer profile cleanly on the server
    const { success, customer, error: syncError } = await syncGoogleUserOnServer(user.id, email, name);

    if (success && customer) {
      // 6. Issue secure mehta_customer_token HTTP-only cookie for customer JWT auth
      const tokenResult = await setCustomerSessionCookie(customer);
      if (!tokenResult.success) {
        console.error('Failed to set customer session cookie:', tokenResult.error);
      }
    } else {
      console.error('Error syncing customer profile in callback:', syncError);
    }
  }

  // Return response containing all newly set HTTP-only cookies
  return response;
}
