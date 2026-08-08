import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { syncGoogleUserOnServer, setCustomerSessionCookie } from './actions';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const redirect = requestUrl.searchParams.get('redirect') || requestUrl.searchParams.get('next') || '/account';
  const origin = requestUrl.origin;

  const cookieStore = await cookies();

  console.log('[OAuth Callback] Incoming request', {
    codePresent: Boolean(code),
    errorPresent: Boolean(error),
    cookieNames: cookieStore.getAll().map((c) => c.name),
  });

  // 1. Handle OAuth Provider Error
  if (error) {
    console.error('[OAuth Callback] Provider error:', errorDescription || error);
    const loginErrorUrl = new URL('/login', origin);
    loginErrorUrl.searchParams.set('error', errorDescription || error);
    return NextResponse.redirect(loginErrorUrl);
  }

  // 2. Validate PKCE Authorization Code
  if (!code) {
    console.error('[OAuth Callback] Missing authorization code');
    const loginErrorUrl = new URL('/login', origin);
    loginErrorUrl.searchParams.set('error', 'Missing authorization code from login provider');
    return NextResponse.redirect(loginErrorUrl);
  }

  // Target redirect destination
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

  const exchangeSuccess = Boolean(exchangeData?.session && !exchangeError);
  console.log('[OAuth Callback] Session Exchange', {
    exchangeSuccess,
    userAuthenticated: Boolean(exchangeData?.session?.user),
  });

  if (exchangeError || !exchangeData?.session?.user) {
    console.error('[OAuth Callback] PKCE exchange failed:', exchangeError?.message);
    const loginErrorUrl = new URL('/login', origin);
    loginErrorUrl.searchParams.set('error', 'Failed to complete Google authentication session exchange');
    return NextResponse.redirect(loginErrorUrl);
  }

  const user = exchangeData.session.user;
  const email = user.email || '';
  const name = user.user_metadata?.full_name || user.user_metadata?.name || 'Google User';

  let customerSessionCreated = false;
  let customerFound = false;

  if (email) {
    // 5. Sync or auto-create customer profile cleanly on the server
    const { success, customer, error: syncError } = await syncGoogleUserOnServer(user.id, email, name);
    customerFound = Boolean(success && customer);

    if (success && customer) {
      // 6. Issue secure mehta_customer_token HTTP-only cookie on response
      const tokenResult = await setCustomerSessionCookie(customer, response);
      customerSessionCreated = Boolean(tokenResult.success);
      if (!tokenResult.success) {
        console.error('[OAuth Callback] Failed to set customer session cookie:', tokenResult.error);
      }
    } else {
      console.error('[OAuth Callback] Error syncing customer profile:', syncError);
    }
  }

  console.log('[OAuth Callback] Result summary', {
    codePresent: true,
    exchangeSuccess: true,
    userAuthenticated: true,
    customerFound,
    customerSessionCreated,
    redirect: targetRedirectUrl.pathname,
    resultingCookieNames: response.cookies.getAll().map((c) => c.name),
  });

  // Return response containing all newly set HTTP-only cookies
  return response;
}
