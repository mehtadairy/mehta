import { isMasterOtpEnabled, isMasterOtpValid } from '../src/lib/master-otp';

async function runMasterOtpVerification() {
  console.log('=== VERIFYING MASTER OTP IMPLEMENTATION ===\n');

  // Test 1: Development Environment Simulation
  process.env.NODE_ENV = 'development';
  process.env.ENABLE_MASTER_OTP = 'true';
  process.env.MASTER_OTP = '123456';

  console.log('[Test 1] Development Mode with ENABLE_MASTER_OTP=true:');
  console.log('  isMasterOtpEnabled():', isMasterOtpEnabled()); // Expected: true
  console.log('  isMasterOtpValid("123456"):', isMasterOtpValid('123456')); // Expected: true (should log [DEV] Master OTP used)
  console.log('  isMasterOtpValid("999999"):', isMasterOtpValid('999999')); // Expected: false

  if (!isMasterOtpEnabled() || !isMasterOtpValid('123456')) {
    throw new Error('Test 1 Failed: Development mode bypass not working');
  }

  // Test 2: Production Environment Simulation
  process.env.NODE_ENV = 'production';
  process.env.ENABLE_MASTER_OTP = 'true'; // Set to true to test force bypass block
  process.env.MASTER_OTP = '123456';

  console.log('\n[Test 2] Production Mode (Even with ENABLE_MASTER_OTP=true set):');
  console.log('  isMasterOtpEnabled():', isMasterOtpEnabled()); // Expected: false
  console.log('  isMasterOtpValid("123456"):', isMasterOtpValid('123456')); // Expected: false

  if (isMasterOtpEnabled() || isMasterOtpValid('123456')) {
    throw new Error('CRITICAL SECURITY FAILURE: Master OTP was enabled in production!');
  }

  console.log('\n=== ALL SECURITY & FUNCTIONALITY TESTS PASSED SUCCESSFULLY! ===');
}

runMasterOtpVerification().catch((err) => {
  console.error('Verification Error:', err);
  process.exit(1);
});
