import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@/lib/auth-utils';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paths that require authentication
  const isAdminRoute = pathname.startsWith('/admin') && pathname !== '/admin/login';
  const isWorkerRoute = pathname.startsWith('/worker') && pathname !== '/worker/login';
  const isProtectedAdminApi = pathname.startsWith('/api/admin') && pathname !== '/api/admin/login';
  const isProtectedWorkerApi = pathname.startsWith('/api/worker') && pathname !== '/api/worker/login';

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
      // We assume payload should not be super_admin to access worker apis strictly,
      // but if admins can do worker things, we might allow them. For now, strict worker isolation.
      if (!payload || payload.role === 'super_admin' || !payload.employeeId) {
         if (isProtectedWorkerApi) {
           return NextResponse.json({ error: 'Unauthorized: Invalid Worker Token' }, { status: 401 });
         }
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/worker/:path*', '/api/admin/:path*', '/api/worker/:path*'],
};
