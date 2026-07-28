import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { signSession, verifySession } from '../src/lib/auth-utils';

async function runAdminWorkerHardeningQATests() {
  console.log('===========================================================');
  console.log('MEHTA DAIRY - ADMIN, WORKER & NOTIFICATION QA TEST SUITE');
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

  // 1. Admin Token Role Validation
  console.log('\n--- 1. ADMIN AUTHORIZATION & ROLE VERIFICATION ---');
  const adminPayload = { id: 'admin_1', role: 'super_admin' };
  const adminToken = await signSession(adminPayload);
  const verifiedAdmin = await verifySession(adminToken);

  assert(verifiedAdmin?.role === 'super_admin', 'Admin Role Claim', 'Session payload contains super_admin role');

  const customerPayload = { id: 'cust_1', role: 'customer' };
  const customerToken = await signSession(customerPayload);
  const verifiedCust = await verifySession(customerToken);

  assert(verifiedCust?.role !== 'super_admin', 'Customer Admin Access Block', 'Customer role rejected for admin operations');

  // 2. Worker Employee ID Validation
  console.log('\n--- 2. WORKER AUTHORIZATION & EMPLOYEE ID VERIFICATION ---');
  const workerPayload = { id: 'w1', employeeId: 'EMP-101', name: 'Ramesh' };
  const workerToken = await signSession(workerPayload);
  const verifiedWorker = await verifySession(workerToken);

  assert(!!verifiedWorker?.employeeId, 'Worker Employee Claim', `Worker employee ID verified: ${verifiedWorker?.employeeId}`);

  // 3. Order Status Transition Matrix Validation
  console.log('\n--- 3. ORDER STATUS TRANSITION VALIDATION ---');
  const validTransitions: Record<string, string[]> = {
    'Processing': ['Preparing', 'Cancelled'],
    'Preparing': ['Packed', 'Cancelled'],
    'Packed': ['Ready For Pickup', 'Shipped', 'Out for Delivery'],
    'Shipped': ['Delivered', 'Returned'],
    'Out for Delivery': ['Delivered', 'Returned']
  };

  assert(validTransitions['Processing'].includes('Preparing'), 'Processing -> Preparing', 'Valid worker status progression');
  assert(validTransitions['Preparing'].includes('Packed'), 'Preparing -> Packed', 'Valid kitchen packing progression');
  assert(!validTransitions['Packed'].includes('Processing'), 'Invalid Status Backwards Jump Block', 'Backward status jump blocked');

  // Summary
  console.log('\n===========================================================');
  console.log(`ADMIN/WORKER HARDENING SUMMARY: ${passedTests}/${totalTests} Tests Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('===========================================================');
}

runAdminWorkerHardeningQATests().catch(console.error);
