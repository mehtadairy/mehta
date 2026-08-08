import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession, verifyCustomerSession } from '@/lib/auth-utils';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  // 1. Refresh Supabase Auth Session (for Google Login)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 1. Refresh Supabase Auth Session (with 1.5s timeout guard to prevent network hangs)
  let sbUser: any = null;
  try {
    const sbRes = await Promise.race([
      supabase.auth.getUser(),
      new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Auth Timeout')), 1500))
    ]);
    sbUser = sbRes?.data?.user || null;
  } catch (e) {
    // Timeout/network fallback - proceed non-blocking
  }

  const { pathname } = request.nextUrl;

  // 0. Forward authorization code to /auth/callback if Google redirected to /?code=...
  if (request.nextUrl.searchParams.has('code') && pathname !== '/auth/callback') {
    const callbackUrl = new URL('/auth/callback', request.url);
    callbackUrl.search = request.nextUrl.search;
    return NextResponse.redirect(callbackUrl);
  }

  const customerToken = request.cookies.get('mehta_customer_token')?.value;

  // Paths that require authentication
  const isAdminRoute = pathname.startsWith('/admin') && pathname !== '/admin/login';
  const isWorkerRoute = pathname.startsWith('/worker') && pathname !== '/worker/login';
  const isProtectedAdminApi = pathname.startsWith('/api/admin') && pathname !== '/api/admin/login';
  const isProtectedWorkerApi = pathname.startsWith('/api/worker') && pathname !== '/api/worker/login';
  const isProtectedCustomerRoute = pathname.startsWith('/account') || pathname.startsWith('/reorder') || pathname.startsWith('/print-station');
  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isCronRoute = pathname.startsWith('/api/cron/');

  // 🔒 2. Admin Route Protection
  if (isAdminRoute || isProtectedAdminApi) {
    const adminToken = request.cookies.get('mehta_admin_token')?.value;
    let isValidAdmin = false;

    if (adminToken) {
      const payload = await verifySession(adminToken);
      if (payload?.role === 'super_admin') isValidAdmin = true;
    }

    if (!isValidAdmin) {
      if (isProtectedAdminApi) {
        return NextResponse.json({ error: 'Unauthorized: Admin authentication required' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // 🔒 3. Worker Route Protection
  if (isWorkerRoute || isProtectedWorkerApi) {
    const workerToken = request.cookies.get('mehta_worker_token')?.value;
    let isValidWorker = false;

    if (workerToken) {
      const payload = await verifySession(workerToken);
      if (payload?.employeeId) isValidWorker = true;
    }

    if (!isValidWorker) {
      if (isProtectedWorkerApi) {
        return NextResponse.json({ error: 'Unauthorized: Worker authentication required' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/worker/login', request.url));
    }
  }

  // 🔒 4. Customer Protected Route Protection
  if (isProtectedCustomerRoute) {
    let isValidCustomer = false;
    if (customerToken) {
      const customerPayload = await verifyCustomerSession(customerToken);
      if (customerPayload?.id) isValidCustomer = true;
    }

    if (!isValidCustomer && sbUser?.id) {
      isValidCustomer = true;
    }

    if (!isValidCustomer) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 🔒 5. Logged-in Customer Auth Page Redirect (/login, /signup -> /account)
  if (isAuthPage) {
    let isLoggedIn = false;
    if (customerToken) {
      const customerPayload = await verifyCustomerSession(customerToken);
      if (customerPayload?.id) isLoggedIn = true;
    }
    if (!isLoggedIn) {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      if (supabaseUser?.id) isLoggedIn = true;
    }

    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/account', request.url));
    }
  }

  // 🔒 6. Cron Route Protection
  if (isCronRoute) {
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.CRON_SECRET;
    
    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or missing Cron Secret' }, { status: 401 });
    }
  }

  // 🔒 OWASP Security Headers Defense-in-Depth
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://cdn.jsdelivr.net https://va.vercel-scripts.com https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https: wss:; frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://www.google.com https://maps.google.com https://*.google.com;"
  );

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|html)$).*)',
  ],
};
