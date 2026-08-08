import { NextResponse } from 'next/server';
import { sendOTP } from '@/lib/services/whatsapp-auth';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter';
import { phoneSchema, logRejectedSubmission } from '@/lib/security-validation';
import { z } from 'zod';

const requestSchema = z.object({
  phone: phoneSchema
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      logRejectedSubmission('/api/auth/login/send-otp', 'Invalid JSON body');
      return NextResponse.json({ success: false, error: 'Invalid request payload' }, { status: 400 });
    }

    const validation = requestSchema.safeParse(body);
    if (!validation.success) {
      logRejectedSubmission('/api/auth/login/send-otp', 'Phone validation failed', validation.error.format());
      return NextResponse.json({ success: false, error: 'Invalid phone number format' }, { status: 400 });
    }

    const cleanPhone = validation.data.phone;
    const clientIp = getClientIp(req);

    // 🔒 Rate Limit: Max 3 OTP requests per IP + phone number per minute
    const rateLimit = checkRateLimit(`otp_login_send_${clientIp}_${cleanPhone}`, 3, 60000);
    if (!rateLimit.success) {
      logRejectedSubmission('/api/auth/login/send-otp', 'Rate limit exceeded', { phone: cleanPhone, ip: clientIp });
      return NextResponse.json({
        success: false,
        error: `Too many requests. Please try again later.`
      }, { status: 429 });
    }

    // Login Flow Requirement: Check if customer exists BEFORE sending OTP
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching customer:', fetchError);
      return NextResponse.json({ success: false, error: 'Database operation failed' }, { status: 500 });
    }

    if (!customer) {
      logRejectedSubmission('/api/auth/login/send-otp', 'Non-existent account login attempt', { phone: cleanPhone });
      // Return 404 so the frontend can automatically redirect the user to the Sign Up flow.
      return NextResponse.json({ success: false, error: 'No account found. Please sign up.' }, { status: 404 });
    }

    const result = await sendOTP(cleanPhone);

    if (result.success) {
      return NextResponse.json({ success: true, message: 'OTP sent successfully' });
    } else {
      logRejectedSubmission('/api/auth/login/send-otp', 'OTP send failed', { error: result.error });
      return NextResponse.json({ success: false, error: 'Failed to send verification code' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Send OTP API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
