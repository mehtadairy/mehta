import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@/lib/auth-utils';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

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

  await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const token = request.cookies.get('mehta_customer_token')?.value;
  console.log(`[AUTH-DEBUG] Middleware running for path: ${pathname}. Cookie mehta_customer_token present: ${!!token}`);

  // Paths that require authentication
  const isAdminRoute = pathname.startsWith('/admin') && pathname !== '/admin/login';
  const isWorkerRoute = pathname.startsWith('/worker') && pathname !== '/worker/login';
  const isProtectedAdminApi = pathname.startsWith('/api/admin') && pathname !== '/api/admin/login';
  const isProtectedWorkerApi = pathname.startsWith('/api/worker') && pathname !== '/api/worker/login';
  const isCronRoute = pathname.startsWith('/api/cron/');

  // Admin Route Protection
  if (isAdminRoute || isProtectedAdminApi) {
    const adminToken = request.cookies.get('mehta_admin_token')?.value;
    if (!adminToken) {
      if (isProtectedAdminApi) {
        return NextResponse.json({ error: 'Unauthorized: Missing Admin Token' }, { status: 401 });
      }
    } else {
      const payload = await verifySession(adminToken);
      if (!payload || payload.role !== 'super_admin') {
        if (isProtectedAdminApi) {
          return NextResponse.json({ error: 'Unauthorized: Invalid Admin Token' }, { status: 401 });
        }
      }
    }
  }

  // Worker Route Protection
  if (isWorkerRoute || isProtectedWorkerApi) {
    const workerToken = request.cookies.get('mehta_worker_token')?.value;
    if (!workerToken) {
      if (isProtectedWorkerApi) {
        return NextResponse.json({ error: 'Unauthorized: Missing Worker Token' }, { status: 401 });
      }
    } else {
      const payload = await verifySession(workerToken);
      if (!payload || payload.role === 'super_admin' || !payload.employeeId) {
         if (isProtectedWorkerApi) {
           return NextResponse.json({ error: 'Unauthorized: Invalid Worker Token' }, { status: 401 });
         }
      }
    }
  }

  // Cron Route Protection
  if (isCronRoute) {
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.CRON_SECRET;
    
    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or missing Cron Secret' }, { status: 401 });
    }
  }

  // Performance Caching Headers for Static Assets & Images
  if (pathname.startsWith('/_next/image') || pathname.match(/\.(png|jpg|jpeg|webp|avif|svg|ico)$/i)) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (pathname.startsWith('/api/delivery/check') || pathname.startsWith('/api/products')) {
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
