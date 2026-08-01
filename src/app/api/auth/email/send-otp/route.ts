import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { Resend } from 'resend';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import VerificationTemplate from '@/emails/VerificationTemplate';
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter';
import { emailSchema, logRejectedSubmission } from '@/lib/security-validation';
import { z } from 'zod';

const emailSendOtpSchema = z.object({
  email: emailSchema
});

// Initialize Resend
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// OTP configuration
const OTP_EXPIRY_MINUTES = 5;
const OTP_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 5;

// Helper to generate 6 digit code
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper to hash OTP
const hashOTP = (otp: string, email: string) => {
  const secret = process.env.JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-secret';
  return crypto.createHmac('sha256', secret)
               .update(otp + email)
               .digest('hex');
};

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body) {
      logRejectedSubmission('/api/auth/email/send-otp', 'Invalid JSON payload');
      return NextResponse.json({ success: false, error: 'Invalid request payload' }, { status: 400 });
    }

    const validation = emailSendOtpSchema.safeParse(body);
    if (!validation.success) {
      logRejectedSubmission('/api/auth/email/send-otp', 'Email validation failed', validation.error.format());
      return NextResponse.json({ success: false, error: 'Invalid email address format' }, { status: 400 });
    }

    const emailLower = validation.data.email;
    const clientIp = getClientIp(request);

    // 🔒 Rate Limit: Max 3 OTP requests per IP + email per minute in-memory
    const rateLimit = checkRateLimit(`email_otp_send_${clientIp}_${emailLower}`, 3, 60000);
    if (!rateLimit.success) {
      logRejectedSubmission('/api/auth/email/send-otp', 'Rate limit exceeded', { email: emailLower, ip: clientIp });
      return NextResponse.json({
        success: false,
        error: `Too many OTP requests. Please try again later.`
      }, { status: 429 });
    }

    if (!resend) {
      console.warn("RESEND_API_KEY is not configured.");
      return NextResponse.json({ success: false, error: 'Email service is not configured' }, { status: 500 });
    }

    // 1. Rate Limiting Check (60 seconds cooldown)
    const { data: recentOTP, error: fetchError } = await supabase
      .from('email_otps')
      .select('created_at')
      .eq('email', emailLower)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!fetchError && recentOTP) {
      const timeSinceLastOTP = Date.now() - new Date(recentOTP.created_at).getTime();
      if (timeSinceLastOTP < OTP_COOLDOWN_SECONDS * 1000) {
        return NextResponse.json({ 
          success: false, 
          error: `Please wait ${Math.ceil((OTP_COOLDOWN_SECONDS * 1000 - timeSinceLastOTP) / 1000)} seconds before requesting another code.` 
        }, { status: 429 });
      }
    }

    // 2. Generate and Hash OTP
    const otp = generateOTP();
    const otpHash = hashOTP(otp, emailLower);
    
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

    // 3. Save to Database
    const { error: insertError } = await supabase
      .from('email_otps')
      .insert([{
        email: emailLower,
        otp_hash: otpHash,
        expires_at: expiresAt,
        attempts: 0,
        used: false
      }]);

    if (insertError) {
      console.error("Database insert error:", insertError);
      return NextResponse.json({ success: false, error: 'Failed to generate OTP. Please ensure database tables are setup.' }, { status: 500 });
    }

    // 4. Send Email via Resend
    try {
      await resend.emails.send({
        from: `Mehta Dairy <noreply@${process.env.RESEND_DOMAIN || 'mehtadairy.com'}>`, // Ensure this domain is verified in Resend
        to: emailLower,
        subject: 'Your Mehta Dairy Verification Code',
        react: VerificationTemplate({ validationCode: otp }) as React.ReactElement,
      });
    } catch (emailError: any) {
      console.error("Resend error:", emailError);
      return NextResponse.json({ success: false, error: 'Failed to send email. ' + (emailError.message || '') }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'OTP sent successfully' });

  } catch (error: any) {
    console.error('Error in send-otp:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
