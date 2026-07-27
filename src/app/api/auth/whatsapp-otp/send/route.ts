import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { WhatsAppService } from '@/lib/services/whatsapp';
import crypto from 'crypto';

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function hashOTP(phone: string, otp: string) {
  // Simple HMAC with a secret to prevent rainbow table attacks, even though it's short lived.
  const secret = process.env.JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'default-secret';
  return crypto.createHmac('sha256', secret).update(`${phone}:${otp}`).digest('hex');
}

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    // WhatsApp requires country code. Defaulting to 91 (India) for Mehta Dairy.
    const waPhone = `91${cleanPhone}`;

    // Rate Limiting Check: Prevent more than 3 OTP requests in 5 minutes
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('otp_codes')
      .select('*', { count: 'exact', head: true })
      .eq('phone', waPhone)
      .gte('created_at', fiveMinsAgo);

    if (count !== null && count >= 3) {
      return NextResponse.json({ 
        success: false, 
        error: 'Too many OTP requests. Please wait 5 minutes.' 
      }, { status: 429 });
    }

    const otp = generateOTP();
    const hashedCode = hashOTP(waPhone, otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    // Delete any old unverified OTP codes for this phone number
    await supabase
      .from('otp_codes')
      .delete()
      .eq('phone', waPhone)
      .eq('verified', false);

    // Store in database
    const { error: insertError } = await supabase.from('otp_codes').insert([{
      phone: waPhone,
      hashed_code: hashedCode,
      expires_at: expiresAt
    }]);

    if (insertError) {
      console.error('OTP Insert Error:', insertError);
      return NextResponse.json({ success: false, error: 'Failed to generate OTP' }, { status: 500 });
    }

    // Send via WhatsApp Service
    const sent = await WhatsAppService.sendOTP(waPhone, otp);

    if (!sent) {
      return NextResponse.json({ success: false, error: 'Failed to send WhatsApp message' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'OTP sent to WhatsApp' });

  } catch (error) {
    console.error('Send OTP Route Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
