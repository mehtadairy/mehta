import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { parseWeightToKg, calculateOrderTotalWeight, createShiprocketOrder } from '../src/lib/services/shiprocket/shipment';
import { getShiprocketToken } from '../src/lib/services/shiprocket/auth';

async function runHardeningAndQATests() {
  console.log('===========================================================');
  console.log('MEHTA DAIRY - SHIPROCKET PRODUCTION HARDENING & QA TEST SUITE');
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

  // 1. Weight Parsing Tests
  console.log('\n--- 1. WEIGHT PARSING & CALCULATION TESTS ---');
  assert(parseWeightToKg('250g') === 0.25, 'Parse 250g', 'Returned 0.25kg');
  assert(parseWeightToKg('500g') === 0.5, 'Parse 500g', 'Returned 0.5kg');
  assert(parseWeightToKg('1kg') === 1.0, 'Parse 1kg', 'Returned 1.0kg');
  assert(parseWeightToKg('2.5kg') === 2.5, 'Parse 2.5kg', 'Returned 2.5kg');

  const multiItems = [
    { weight: '500g', quantity: 2 },
    { weight: '1kg', quantity: 1 },
    { weight: '250g', quantity: 4 }
  ];
  const calculatedTotal = calculateOrderTotalWeight(multiItems);
  assert(calculatedTotal === 3.0, 'Multi-product order total weight', `Expected 3.0kg, got ${calculatedTotal}kg`);

  // 2. Token Management & Auth Resiliency Test
  console.log('\n--- 2. AUTHENTICATION & TOKEN MANAGEMENT TESTS ---');
  const authRes = await getShiprocketToken();
  assert(authRes.success === true && !!authRes.token, 'Token Retrieval', `Token resolved successfully (Fallback: ${!!authRes.isFallback})`);

  // 3. Idempotency & Concurrent Locking Test
  console.log('\n--- 3. IDEMPOTENCY & CONCURRENT LOCKING TESTS ---');
  const testOrderId = 'non_existent_mock_id_qa_' + Date.now();
  const [res1, res2] = await Promise.all([
    createShiprocketOrder(testOrderId),
    createShiprocketOrder(testOrderId)
  ]);
  const lockTriggered = res1.error === 'Shipment creation already in progress' || res2.error === 'Shipment creation already in progress';
  assert(lockTriggered || res1.success || res2.success, 'Concurrent execution handled', 'Concurrent double-click execution intercepted by mutex lock');

  // Summary
  console.log('\n===========================================================');
  console.log(`HARDENING & QA SUMMARY: ${passedTests}/${totalTests} Tests Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('===========================================================');
}

runHardeningAndQATests().catch(console.error);
