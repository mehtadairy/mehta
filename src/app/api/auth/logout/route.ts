import { NextResponse } from 'next/server';
import { getCustomerCookieOptions } from '@/lib/auth-utils';

export async function POST(req: Request) {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  
  const cookieOptions = getCustomerCookieOptions(req.headers.get('host'));
  response.cookies.set('mehta_customer_token', '', {
    ...cookieOptions,
    maxAge: 0,
    expires: new Date(0) // Expire immediately
  });

  return response;
}
