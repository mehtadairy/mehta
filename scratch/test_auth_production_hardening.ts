import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { sendOTP, verifyOTP } from '../src/lib/services/whatsapp-auth';
import { signSession, verifySession } from '../src/lib/auth-utils';

async function runAuthHardeningQATests() {
  console.log('===========================================================');
  console.log('MEHTA DAIRY - AUTHENTICATION COMPLETE QA & SECURITY TEST SUITE');
  console.log('===========================================================');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(` ✅ PASS: [${testName}] ${detail || ''}`);
    } else {
      console.error(` ❌ FAIL: [${testName}] ${detail || ''}`);
    }
  }

  // 1. Session JWT Sign & Verify Test
  console.log('\n--- 1. SESSION SIGNING & VERIFICATION TESTS ---');
  const mockPayload = { id: 'admin_test_123', role: 'super_admin', email: 'admin@mehtadairy.com' };
  const signedToken = await signSession(mockPayload);
  assert(!!signedToken && signedToken.includes('.'), 'Session Signing', 'Signed HMAC token string generated');

  const verifiedPayload = await verifySession(signedToken);
  assert(verifiedPayload?.id === mockPayload.id && verifiedPayload?.role === 'super_admin', 'Session Verification', 'Payload recovered and signature verified');

  const invalidToken = signedToken.slice(0, -4) + 'abcd';
  const invalidVerified = await verifySession(invalidToken);
  assert(invalidVerified === null, 'Tampered Token Rejection', 'Tampered signature returned null');

  // 2. Production Test OTP Bypass Restriction Test
  console.log('\n--- 2. PRODUCTION TEST OTP BYPASS RESTRICTION TEST ---');
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  process.env.ALLOW_TEST_OTP = 'false';

  const prodBypassResult = await verifyOTP('9913252232', '123456');
  assert(prodBypassResult.success === false, 'Prod 123456 Bypass Restriction', `In production mode, '123456' test OTP is rejected (${prodBypassResult.error})`);

  process.env.NODE_ENV = originalEnv;

  // 3. OTP Rate Limiting & Cooldown Test
  console.log('\n--- 3. OTP RATE LIMITING & COOLDOWN TEST ---');
  const testPhone = '9913259999';
  const send1 = await sendOTP(testPhone);
  assert(send1.success === true, 'First OTP Request', 'OTP request initiated');

  const send2 = await sendOTP(testPhone);
  assert(send2.success === false && (send2.error?.includes('wait') || send2.error?.includes('seconds')), 'Rate Limit Cooldown', `Rapid request intercepted: "${send2.error}"`);

  // Summary
  console.log('\n===========================================================');
  console.log(`AUTH HARDENING SUMMARY: ${passedTests}/${totalTests} Tests Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('===========================================================');
}

runAuthHardeningQATests().catch(console.error);
