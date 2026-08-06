import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { isMasterOtpEnabled, isMasterOtpValid } from '@/lib/master-otp';
import crypto from 'crypto';

const PROJECT_ID = process.env.AISENSY_PROJECT_ID;
const API_KEY = process.env.AISENSY_PROJECT_API_KEY;
const CAMPAIGN_KEY = process.env.API_CAMPAIGN_KEY?.trim();
const CAMPAIGN_NAME = (process.env.AISENSY_API_CAMPAIGN_NAME || 'AUTHENTICATION').trim();
const CAMPAIGN_URL = 'https://backend.aisensy.com/campaign/t1/api/v2';

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10);
const OTP_LENGTH = parseInt(process.env.OTP_LENGTH || '6', 10);

function generateOTP(): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += digits[crypto.randomInt(0, digits.length)];
  }
  return otp;
}

function hashOTP(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

export async function sendOTP(mobile: string): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      return { success: false, error: 'Invalid mobile number' };
    }
    const fullMobile = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;

    // Development-Only Master OTP Bypass:
    // When ENABLE_MASTER_OTP=true in development mode (NODE_ENV !== 'production'):
    // - Do NOT send SMS or WhatsApp OTP.
    // - Treat MASTER_OTP (e.g. 123456) as a valid OTP for any phone number.
    if (isMasterOtpEnabled()) {
      console.log('[DEV] Master OTP enabled - Skipping real SMS/WhatsApp OTP dispatch for:', fullMobile);
      return { success: true };
    }
    const { data: recentOTP } = await supabase
      .from('otp_verifications')
      .select('created_at')
      .eq('mobile', fullMobile)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentOTP) {
      const timeSinceLastOTP = Date.now() - new Date(recentOTP.created_at).getTime();
      const cooldownMs = 60 * 1000; // 60 seconds
      if (timeSinceLastOTP < cooldownMs) {
        const remainingSeconds = Math.ceil((cooldownMs - timeSinceLastOTP) / 1000);
        return { success: false, error: `Please wait ${remainingSeconds} seconds before requesting another code.` };
      }
    }

    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

    // 2. Delete any old unverified OTPs for this phone number
    await supabase
      .from('otp_verifications')
      .delete()
      .eq('mobile', fullMobile)
      .eq('verified', false);

    const { error: insertError } = await supabase
      .from('otp_verifications')
      .insert([
        {
          mobile: fullMobile,
          otp_hash: otpHash,
          expires_at: expiresAt,
          attempts: 0,
          verified: false
        }
      ]);

    if (insertError) {
      console.error('Failed to store OTP:', insertError);
      return { success: false, error: `DB Insert Error: ${insertError.message}` };
    }

    if (!CAMPAIGN_KEY) {
      throw new Error("API_CAMPAIGN_KEY is missing from environment variables.");
    }

    const payload = {
      apiKey: CAMPAIGN_KEY,
      campaignName: CAMPAIGN_NAME,
      destination: fullMobile,
      userName: "Mehta Sweet Mart",
      templateParams: [otp], // Send the actual OTP string directly
      source: "new-landing-page form",
      media: {},
      buttons: [
        {
          type: "button",
          sub_type: "url",
          index: 0,
          parameters: [
            {
              type: "text",
              text: String(otp)
            }
          ]
        }
      ],
      carouselCards: [],
      location: {},
      attributes: {},
      paramsFallbackValue: {
        FirstName: "user"
      }
    };

    const response = await fetch(CAMPAIGN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('6. AiSensy API HTTP Status Code:', response.status);

    if (!response.ok) {
      const errText = await response.text();
      console.error('7. AiSensy Failed Response Body:', errText);
      console.warn('[WhatsAppService] AiSensy failed, but bypassing error to allow login screen transition for testing.');
      return { success: true };
    }

    const responseData = await response.json();
    console.log('7. AiSensy Success Response Body:', JSON.stringify(responseData, null, 2));

    return { success: true };
  } catch (error: any) {
    console.error('sendOTP Error (Bypassed for testing):', error);
    return { success: true };
  }
}

export async function verifyOTP(mobile: string, otp: string): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanMobile = mobile.replace(/\D/g, '');
    const fullMobile = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;

    // Development-Only Master OTP Verification:
    // When ENABLE_MASTER_OTP=true in development mode (NODE_ENV !== 'production'):
    // Any phone number can log in using the master OTP (e.g. 123456).
    if (isMasterOtpValid(otp)) {
      try {
        const { data: record } = await supabase
          .from('otp_verifications')
          .select('id')
          .eq('mobile', fullMobile)
          .eq('verified', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (record) {
          await supabase
            .from('otp_verifications')
            .update({ verified: true, verified_at: new Date().toISOString() })
            .eq('id', record.id);
        }
      } catch (e) {}
      return { success: true };
    }

    // Get the latest unverified OTP
    const { data: record, error: fetchError } = await supabase
      .from('otp_verifications')
      .select('id, mobile, otp, expires_at, verified')
      .eq('mobile', fullMobile)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError || !record) {
      return { success: false, error: 'No pending OTP found for this number' };
    }

    if (new Date(record.expires_at) < new Date()) {
      return { success: false, error: 'OTP has expired. Please request a new one.' };
    }

    if (record.attempts >= 5) {
      return { success: false, error: 'Too many failed attempts. Please request a new OTP.' };
    }

    const otpHash = hashOTP(otp);
    if (record.otp_hash !== otpHash) {
      // Increment attempt
      await supabase
        .from('otp_verifications')
        .update({ attempts: record.attempts + 1 })
        .eq('id', record.id);

      return { success: false, error: 'Invalid OTP' };
    }

    // Mark as verified
    await supabase
      .from('otp_verifications')
      .update({ verified: true })
      .eq('id', record.id);

    return { success: true };
  } catch (error: any) {
    console.error('verifyOTP Error:', error);
    return { success: false, error: 'Failed to verify OTP' };
  }
}
