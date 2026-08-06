/**
 * DEVELOPMENT-ONLY Master OTP Helper.
 * 
 * Requirements & Security Rules:
 * 1. ENABLE_MASTER_OTP=true (in .env.local)
 * 2. MASTER_OTP=123456 (in .env.local)
 * 3. When ENABLE_MASTER_OTP=true in development:
 *    - Any phone number / email can log in using OTP 123456.
 *    - Do NOT send SMS or WhatsApp OTP.
 *    - Treat 123456 as a valid OTP for every phone number / email.
 *    - Create normal authenticated session after successful verification.
 *    - Log "[DEV] Master OTP used" on the server for debugging.
 * 4. When ENABLE_MASTER_OTP=false:
 *    - Use normal OTP flow.
 *    - Send real OTPs.
 *    - Verify only generated OTPs.
 * 5. SECURITY RULE:
 *    - This feature MUST NEVER work in production.
 *    - If process.env.NODE_ENV === "production", ignore ENABLE_MASTER_OTP completely.
 *    - Even if someone sets ENABLE_MASTER_OTP=true in production env, it is automatically disabled.
 */

export function isMasterOtpEnabled(): boolean {
  // CRITICAL SECURITY RULE: Master OTP MUST NEVER work in production under any circumstances
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  return process.env.ENABLE_MASTER_OTP === 'true';
}

export function getMasterOtpValue(): string {
  return process.env.MASTER_OTP || '123456';
}

export function isMasterOtpValid(otp: string): boolean {
  // Disable completely in production
  if (!isMasterOtpEnabled()) {
    return false;
  }

  const expectedMasterOtp = getMasterOtpValue();
  const isValid = typeof otp === 'string' && otp.trim() === expectedMasterOtp.trim();

  if (isValid) {
    console.log('[DEV] Master OTP used');
  }

  return isValid;
}
