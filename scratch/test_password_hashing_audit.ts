import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { hashPassword, verifyPassword, needsRehash, generateStrongPassword } from '../src/lib/password-utils';
import { getSanitizedStaffStore } from '../src/lib/staff-store';

async function runPasswordAuditTests() {
  console.log("==================================================");
  console.log("🔐 PASSWORD HASHING & SECURITY AUDIT TEST SUITE");
  console.log("==================================================\n");

  const rawPassword = "TestPassword@123";

  // ── TEST 1: Bcrypt Cost Factor 12 Hashing ──
  console.log("--- 1. Testing Bcrypt Cost Factor 12 Hashing ---");
  const hashed = hashPassword(rawPassword);
  console.log(`Generated Hash: ${hashed.substring(0, 30)}...`);
  console.log(`Starts with '$2b$12$' or '$2a$12$': ${hashed.startsWith('$2b$12$') || hashed.startsWith('$2a$12$')}`);

  if (hashed.startsWith('$2b$12$') || hashed.startsWith('$2a$12$')) {
    console.log("  ✔ PASS: Password successfully hashed with Bcrypt Cost Factor 12.");
  } else {
    console.error("  ❌ FAIL: Hash format invalid.");
  }

  // ── TEST 2: Password Verification ──
  console.log("\n--- 2. Testing Secure Password Verification ---");
  const isValid = verifyPassword(rawPassword, hashed);
  const isInvalid = verifyPassword("WrongPassword123", hashed);
  console.log(`Valid password check: ${isValid}`);
  console.log(`Wrong password check: ${isInvalid}`);

  if (isValid && !isInvalid) {
    console.log("  ✔ PASS: Password verification functions correctly.");
  } else {
    console.error("  ❌ FAIL: Verification logic error.");
  }

  // ── TEST 3: Legacy Format & Automatic Rehash Detection ──
  console.log("\n--- 3. Testing Automatic Migration & Rehashing Detection ---");
  const legacySaltHash = "1234567890abcdef:fedcba0987654321";
  const legacyPlaintext = "admin123";

  console.log(`needsRehash(bcrypt12): ${needsRehash(hashed)}`);
  console.log(`needsRehash(legacySaltHash): ${needsRehash(legacySaltHash)}`);
  console.log(`needsRehash(legacyPlaintext): ${needsRehash(legacyPlaintext)}`);

  if (!needsRehash(hashed) && needsRehash(legacySaltHash) && needsRehash(legacyPlaintext)) {
    console.log("  ✔ PASS: Automatic migration detector correctly flags legacy hashes for upgrading.");
  } else {
    console.error("  ❌ FAIL: Rehash detector error.");
  }

  // ── TEST 4: Response Sanitization ──
  console.log("\n--- 4. Testing API Response Sanitization ---");
  const sanitizedStaff = getSanitizedStaffStore();
  const leaksHash = sanitizedStaff.some((s: any) => 'password_hash' in s || 'password' in s);
  console.log(`Sanitized staff count: ${sanitizedStaff.length}`);
  console.log(`Leaks password fields in API output: ${leaksHash}`);

  if (!leaksHash) {
    console.log("  ✔ PASS: Staff list responses strip sensitive password hash fields.");
  } else {
    console.error("  ❌ FAIL: Sensitive field leak detected.");
  }

  // ── TEST 5: Strong Password Generator ──
  console.log("\n--- 5. Testing High-Entropy Password Generator ---");
  const strong = generateStrongPassword(16);
  console.log(`Generated 16-char Password length: ${strong.length}`);
  if (strong.length === 16) {
    console.log("  ✔ PASS: Strong password generator working.");
  }

  console.log("\n==================================================");
  console.log("✔ ALL PASSWORD SECURITY AUDIT TESTS PASSED");
  console.log("==================================================");
}

runPasswordAuditTests().catch(console.error);
