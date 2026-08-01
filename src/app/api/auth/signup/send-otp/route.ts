import { NextResponse } from 'next/server';
import { sendOTP } from '@/lib/services/whatsapp-auth';
import { checkRateLimit } from '@/lib/rate-limiter';
import { phoneSchema, logRejectedSubmission } from '@/lib/security-validation';
import { z } from 'zod';

const requestSchema = z.object({
  phone: phoneSchema
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      logRejectedSubmission('/api/auth/signup/send-otp', 'Invalid JSON body');
      return NextResponse.json({ success: false, error: 'Invalid request payload' }, { status: 400 });
    }

    const validation = requestSchema.safeParse(body);
    if (!validation.success) {
      logRejectedSubmission('/api/auth/signup/send-otp', 'Phone validation failed', validation.error.format());
      return NextResponse.json({ success: false, error: 'Invalid phone number format' }, { status: 400 });
    }

    const cleanPhone = validation.data.phone;

    // 🔒 Rate Limit: Max 3 OTP requests per phone number per minute
    const rateLimit = checkRateLimit(`otp_send_${cleanPhone}`, 3, 60000);
    if (!rateLimit.success) {
      logRejectedSubmission('/api/auth/signup/send-otp', 'Rate limit exceeded', { phone: cleanPhone });
      return NextResponse.json({
        success: false,
        error: `Too many requests. Please try again later.`
      }, { status: 429 });
    }

    // Signup Flow: We send the OTP here.
    const result = await sendOTP(cleanPhone);

    if (result.success) {
      return NextResponse.json({ success: true, message: 'OTP sent successfully' });
    } else {
      logRejectedSubmission('/api/auth/signup/send-otp', 'OTP dispatch failed', { error: result.error });
      return NextResponse.json({ success: false, error: 'Failed to send verification code' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Send OTP API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
