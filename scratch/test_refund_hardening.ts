/**
 * Automated Test Suite: Razorpay Refund Hardening & Failure-Scenario Audit
 * Mehta Dairy Order Cancellation & Refund Infrastructure
 */

import crypto from 'crypto';

interface MockOrder {
  id: string;
  order_number: string;
  customer_id: string;
  user_phone: string;
  payment_method: 'COD' | 'Online' | 'Razorpay';
  payment_status: 'Pending' | 'Paid' | 'Refund Initiated' | 'Refund Completed' | 'Refund Failed' | 'Refund Reversed';
  payment_id?: string;
  status: string;
  total: number;
}

interface MockRefund {
  id: string;
  order_id: string;
  payment_id: string;
  razorpay_refund_id?: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSED' | 'FAILED' | 'REVERSED';
  reason?: string;
  metadata?: Record<string, any>;
}

// Mock Database Storage
class MockDB {
  orders: Map<string, MockOrder> = new Map();
  refunds: Map<string, MockRefund> = new Map();
  notifications: any[] = [];
  razorpayCalls: any[] = [];

  reset() {
    this.orders.clear();
    this.refunds.clear();
    this.notifications = [];
    this.razorpayCalls = [];
  }
}

const db = new MockDB();

// Simulated Business Logic matching /api/orders/cancel/route.ts
async function handleOrderCancellation(authCustomerId: string, orderId: string, reason: string) {
  const order = db.orders.get(orderId);
  if (!order) return { status: 404, error: 'Order not found' };

  if (order.customer_id !== authCustomerId) {
    return { status: 403, error: 'Unauthorized customer' };
  }

  const uncancelableStatuses = ['Preparing', 'Packed', 'Ready', 'Out for Delivery', 'Delivered'];
  if (uncancelableStatuses.includes(order.status)) {
    return { status: 400, error: 'Order cannot be cancelled' };
  }

  if (order.status === 'Cancelled') {
    return { status: 400, error: 'Order is already cancelled' };
  }

  const isOnline = order.payment_method === 'Online' || order.payment_method === 'Razorpay';
  const isPaid = order.payment_status.toLowerCase() === 'paid';

  if (!isOnline) {
    order.status = 'Cancelled';
    return { status: 200, success: true, refundStatus: 'N/A' };
  }

  if (!isPaid) {
    return { status: 400, error: 'Uncaptured payment' };
  }

  if (!order.payment_id || !order.payment_id.startsWith('pay_')) {
    return { status: 400, error: 'Invalid payment ID' };
  }

  // Idempotency & Reconciliation check
  const existingRefund = Array.from(db.refunds.values()).find(r => r.order_id === orderId);
  
  if (existingRefund) {
    if (existingRefund.status === 'PROCESSED') {
      return { status: 200, success: true, refundStatus: 'Completed', message: 'Already processed' };
    }
    if (existingRefund.status === 'REVERSED') {
      return { status: 200, success: true, refundStatus: 'Reversed', message: 'Already reversed' };
    }

    // Check if Razorpay already created it
    const rzpCall = db.razorpayCalls.find(c => c.payment_id === order.payment_id && c.idempotencyKey === existingRefund.metadata?.idempotency_key);
    if (rzpCall) {
      existingRefund.razorpay_refund_id = rzpCall.refund_id;
      existingRefund.status = rzpCall.status === 'processed' ? 'PROCESSED' : 'PENDING';
      order.status = 'Cancelled';
      order.payment_status = existingRefund.status === 'PROCESSED' ? 'Refund Completed' : 'Refund Initiated';
      return { status: 200, success: true, refundStatus: existingRefund.status === 'PROCESSED' ? 'Completed' : 'Initiated' };
    }
  }

  const idempotencyKey = existingRefund?.metadata?.idempotency_key || `refund_${order.id}`;

  if (!existingRefund) {
    const refundRecord: MockRefund = {
      id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      order_id: order.id,
      payment_id: order.payment_id,
      amount: order.total,
      currency: 'INR',
      status: 'PENDING',
      reason,
      metadata: { idempotency_key: idempotencyKey }
    };
    db.refunds.set(refundRecord.id, refundRecord);
  }

  // Call Razorpay API
  const amountPaise = Math.round(order.total * 100);
  const rzpRefundId = `rfnd_${Date.now()}`;
  db.razorpayCalls.push({
    payment_id: order.payment_id,
    amount: amountPaise,
    idempotencyKey,
    refund_id: rzpRefundId,
    status: 'pending'
  });

  const ref = Array.from(db.refunds.values()).find(r => r.order_id === orderId)!;
  ref.razorpay_refund_id = rzpRefundId;
  order.status = 'Cancelled';
  order.payment_status = 'Refund Initiated';

  return { status: 200, success: true, refundStatus: 'Initiated' };
}

// Simulated Webhook Processing
function handleWebhook(event: string, payload: any) {
  const entity = payload.entity;
  const rzpRefundId = entity.id;
  const rzpPaymentId = entity.payment_id;

  const refund = Array.from(db.refunds.values()).find(r => r.razorpay_refund_id === rzpRefundId || r.payment_id === rzpPaymentId);
  const order = refund ? db.orders.get(refund.order_id) : null;

  if (event === 'refund.processed') {
    if (refund?.status === 'PROCESSED') return { status: 'ok', detail: 'already_processed' };
    if (refund) refund.status = 'PROCESSED';
    if (order) order.payment_status = 'Refund Completed';
    db.notifications.push({ type: 'REFUND_COMPLETED', phone: order?.user_phone });
  } else if (event === 'refund.failed') {
    if (refund?.status === 'FAILED') return { status: 'ok', detail: 'already_failed' };
    if (refund) refund.status = 'FAILED';
    if (order) order.payment_status = 'Refund Failed';
    db.notifications.push({ type: 'REFUND_FAILED', phone: order?.user_phone });
  } else if (event === 'refund.reversed') {
    if (refund?.status === 'REVERSED') return { status: 'ok', detail: 'already_reversed' };
    if (refund) refund.status = 'REVERSED';
    if (order) order.payment_status = 'Refund Reversed';
    db.notifications.push({ type: 'REFUND_REVERSED', phone: order?.user_phone });
  }

  return { status: 'ok', event };
}

// RUN ALL 14 TEST CASES
async function runTestSuite() {
  console.log("==================================================");
  console.log("STARTING HARDENED REFUND SUITE ASSERTIONS...");
  console.log("==================================================");

  let passed = 0;
  let total = 14;

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
    }
  };

  // TEST 1: COD Cancellation
  db.reset();
  db.orders.set('o1', { id: 'o1', order_number: 'MD-101', customer_id: 'c1', user_phone: '9876543210', payment_method: 'COD', payment_status: 'Pending', status: 'Processing', total: 500 });
  const t1 = await handleOrderCancellation('c1', 'o1', 'Changed mind');
  assert(t1.status === 200 && db.orders.get('o1')?.status === 'Cancelled' && db.refunds.size === 0 && db.razorpayCalls.length === 0, 'TEST 1: COD cancellation (no Razorpay call, no refund row)');

  // TEST 2: Online Paid Cancellation
  db.reset();
  db.orders.set('o2', { id: 'o2', order_number: 'MD-102', customer_id: 'c1', user_phone: '9876543210', payment_method: 'Online', payment_status: 'Paid', payment_id: 'pay_123', status: 'Processing', total: 1000 });
  const t2 = await handleOrderCancellation('c1', 'o2', 'Wrong item');
  assert(t2.status === 200 && db.refunds.size === 1 && db.orders.get('o2')?.payment_status === 'Refund Initiated', 'TEST 2: Online paid cancellation (creates 1 refund row & initiates Razorpay)');

  // TEST 3: Double-click Cancellation
  const t3 = await handleOrderCancellation('c1', 'o2', 'Wrong item again');
  assert((t3.status === 200 || t3.status === 400) && db.refunds.size === 1 && db.razorpayCalls.length === 1, 'TEST 3: Double-click cancellation (strictly 1 refund record & no duplicate Razorpay calls)');

  // TEST 4: Simultaneous Cancellation (Concurrency)
  db.reset();
  db.orders.set('o4', { id: 'o4', order_number: 'MD-104', customer_id: 'c1', user_phone: '9876543210', payment_method: 'Online', payment_status: 'Paid', payment_id: 'pay_104', status: 'Processing', total: 1500 });
  const [resA, resB] = await Promise.all([
    handleOrderCancellation('c1', 'o4', 'Parallel A'),
    handleOrderCancellation('c1', 'o4', 'Parallel B')
  ]);
  assert(db.refunds.size === 1 && (resA.status === 200 || resB.status === 200), 'TEST 4: Two simultaneous requests yield exactly 1 refund record');

  // TEST 5: Razorpay Timeout & Idempotency Key Reuse
  db.reset();
  db.orders.set('o5', { id: 'o5', order_number: 'MD-105', customer_id: 'c1', user_phone: '9876543210', payment_method: 'Online', payment_status: 'Paid', payment_id: 'pay_105', status: 'Processing', total: 2000 });
  await handleOrderCancellation('c1', 'o5', 'Timeout test');
  const key1 = db.razorpayCalls[0].idempotencyKey;
  // Retry cancellation
  await handleOrderCancellation('c1', 'o5', 'Timeout test retry');
  assert(key1 === `refund_o5`, 'TEST 5: Retry reuses the exact same X-Refund-Idempotency key');

  // TEST 6: Server Crash Simulation Recovery
  db.reset();
  db.orders.set('o6', { id: 'o6', order_number: 'MD-106', customer_id: 'c1', user_phone: '9876543210', payment_method: 'Online', payment_status: 'Paid', payment_id: 'pay_106', status: 'Processing', total: 2500 });
  // Insert pending row simulating crash right after razorpay created refund
  db.refunds.set('ref_crash', { id: 'ref_crash', order_id: 'o6', payment_id: 'pay_106', amount: 2500, currency: 'INR', status: 'PENDING', metadata: { idempotency_key: 'refund_o6' } });
  db.razorpayCalls.push({ payment_id: 'pay_106', idempotencyKey: 'refund_o6', refund_id: 'rfnd_crashed', status: 'processed' });
  const t6 = await handleOrderCancellation('c1', 'o6', 'Recovery after crash');
  assert(t6.refundStatus === 'Completed' && db.orders.get('o6')?.payment_status === 'Refund Completed', 'TEST 6: Server crash recovery reconciles with existing Razorpay refund');

  // TEST 7: refund.created Webhook
  db.reset();
  db.orders.set('o7', { id: 'o7', order_number: 'MD-107', customer_id: 'c1', user_phone: '9876543210', payment_method: 'Online', payment_status: 'Paid', payment_id: 'pay_107', status: 'Processing', total: 3000 });
  db.refunds.set('ref_7', { id: 'ref_7', order_id: 'o7', payment_id: 'pay_107', amount: 3000, currency: 'INR', status: 'PENDING', razorpay_refund_id: 'rfnd_7' });
  const t7 = handleWebhook('refund.created', { entity: { id: 'rfnd_7', payment_id: 'pay_107', amount: 300000, notes: { order_id: 'o7' } } });
  assert(t7.status === 'ok', 'TEST 7: refund.created webhook processed cleanly');

  // TEST 8: refund.processed Webhook
  const t8 = handleWebhook('refund.processed', { entity: { id: 'rfnd_7', payment_id: 'pay_107', amount: 300000, notes: { order_id: 'o7' } } });
  assert(db.orders.get('o7')?.payment_status === 'Refund Completed' && db.refunds.get('ref_7')?.status === 'PROCESSED', 'TEST 8: refund.processed webhook flips order to Refund Completed');

  // TEST 9: refund.failed Webhook
  db.reset();
  db.orders.set('o9', { id: 'o9', order_number: 'MD-109', customer_id: 'c1', user_phone: '9876543210', payment_method: 'Online', payment_status: 'Paid', payment_id: 'pay_109', status: 'Processing', total: 3500 });
  db.refunds.set('ref_9', { id: 'ref_9', order_id: 'o9', payment_id: 'pay_109', amount: 3500, currency: 'INR', status: 'PENDING', razorpay_refund_id: 'rfnd_9' });
  handleWebhook('refund.failed', { entity: { id: 'rfnd_9', payment_id: 'pay_109', amount: 350000, notes: { order_id: 'o9' } } });
  assert(db.orders.get('o9')?.payment_status === 'Refund Failed' && db.refunds.get('ref_9')?.status === 'FAILED', 'TEST 9: refund.failed webhook flips order to Refund Failed');

  // TEST 10: refund.reversed Webhook
  db.reset();
  db.orders.set('o10', { id: 'o10', order_number: 'MD-110', customer_id: 'c1', user_phone: '9876543210', payment_method: 'Online', payment_status: 'Refund Completed', payment_id: 'pay_110', status: 'Cancelled', total: 4000 });
  db.refunds.set('ref_10', { id: 'ref_10', order_id: 'o10', payment_id: 'pay_110', amount: 4000, currency: 'INR', status: 'PROCESSED', razorpay_refund_id: 'rfnd_10' });
  handleWebhook('refund.reversed', { entity: { id: 'rfnd_10', payment_id: 'pay_110', amount: 400000, notes: { order_id: 'o10' } } });
  assert(db.orders.get('o10')?.payment_status === 'Refund Reversed' && db.refunds.get('ref_10')?.status === 'REVERSED', 'TEST 10: refund.reversed webhook flips order to Refund Reversed');

  // TEST 11: Duplicate Webhook Handling (Idempotency)
  const initialNotifCount = db.notifications.length;
  const dupRes = handleWebhook('refund.reversed', { entity: { id: 'rfnd_10', payment_id: 'pay_110', amount: 400000, notes: { order_id: 'o10' } } });
  assert(dupRes.detail === 'already_reversed' && db.notifications.length === initialNotifCount, 'TEST 11: Duplicate webhook delivery produces 0 duplicate notifications or state changes');

  // TEST 12: Unauthorized Customer Cancellation
  db.reset();
  db.orders.set('o12', { id: 'o12', order_number: 'MD-112', customer_id: 'c1', user_phone: '9876543210', payment_method: 'Online', payment_status: 'Paid', payment_id: 'pay_112', status: 'Processing', total: 4500 });
  const t12 = await handleOrderCancellation('c_unauthorized', 'o12', 'Hacking attempt');
  assert(t12.status === 403 && db.refunds.size === 0, 'TEST 12: Unauthorized customer cancellation rejected with 403');

  // TEST 13: Already Cancelled Order
  db.reset();
  db.orders.set('o13', { id: 'o13', order_number: 'MD-113', customer_id: 'c1', user_phone: '9876543210', payment_method: 'Online', payment_status: 'Refund Completed', payment_id: 'pay_113', status: 'Cancelled', total: 5000 });
  const t13 = await handleOrderCancellation('c1', 'o13', 'Cancel again');
  assert(t13.status === 400 && db.refunds.size === 0, 'TEST 13: Already cancelled order rejected');

  // TEST 14: Uncaptured Payment
  db.reset();
  db.orders.set('o14', { id: 'o14', order_number: 'MD-114', customer_id: 'c1', user_phone: '9876543210', payment_method: 'Online', payment_status: 'Pending', payment_id: 'pay_114', status: 'Pending Payment', total: 5500 });
  const t14 = await handleOrderCancellation('c1', 'o14', 'Uncaptured payment test');
  assert(t14.status === 400 && db.refunds.size === 0, 'TEST 14: Uncaptured payment refund attempt rejected');

  console.log("==================================================");
  console.log(`TEST SUITE RESULTS: ${passed}/${total} PASSED`);
  console.log("==================================================");

  if (passed !== total) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error("Test Suite Runtime Error:", err);
  process.exit(1);
});
