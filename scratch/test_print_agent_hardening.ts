import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { supabaseServer } from '../src/lib/supabaseServer';
import { PrintingService } from '../src/lib/services/printing';

async function runPrintSystemHardeningTests() {
  console.log("=================================================");
  console.log("🖨️ PRINTING SYSTEM HARDENING & CANCEL TEST SUITE");
  console.log("=================================================");

  const testOrderId = `TEST-PRINT-${Date.now()}`;
  const testOrderNumber = `ORD-PRNT-${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    // Step 1: Create mock order in DB
    console.log("\n[Test 1] Creating mock order in DB...");
    const { data: mockOrder, error: insertErr } = await supabaseServer
      .from('orders')
      .insert([{
        id: testOrderId,
        order_number: testOrderNumber,
        status: 'Processing',
        payment_status: 'Paid',
        payment_method: 'Razorpay',
        subtotal: 500,
        delivery_charge: 70,
        total: 570,
        user_name: 'POS Audit Tester',
        user_phone: '9876543210',
        shipping_address: { street: '123 Market Rd', city: 'Bhavnagar', pincode: '364001' },
        printed: false,
        print_status: 'pending'
      }])
      .select()
      .single();

    if (insertErr) throw new Error("Mock order insert failed: " + insertErr.message);
    console.log("✅ Mock order created:", mockOrder.order_number);

    // Step 2: Queue standard print jobs
    console.log("\n[Test 2] Queueing new order print jobs...");
    const mockOrderWithItems = {
      ...mockOrder,
      items: [{ productName: 'Kesar Peda', quantity: 2, weight: '500g', price: 250 }]
    };
    await PrintingService.queueOrderPrints(mockOrderWithItems, 'Main');

    const { data: newJobs } = await supabaseServer
      .from('print_jobs')
      .select('*')
      .eq('order_id', testOrderId);

    console.log(`✅ Queued ${newJobs?.length || 0} print job(s) for order:`, newJobs?.map(j => j.target_printer));
    if (!newJobs || newJobs.length === 0) throw new Error("No print jobs created!");

    // Step 3: Test Idempotency (Prevent Duplicates)
    console.log("\n[Test 3] Testing Duplicate Queue Prevention...");
    await PrintingService.queueOrderPrints(mockOrderWithItems, 'Main');
    const { data: duplicateJobsCheck } = await supabaseServer
      .from('print_jobs')
      .select('*')
      .eq('order_id', testOrderId);

    if (duplicateJobsCheck?.length !== newJobs.length) {
      throw new Error(`Idempotency failed! Expected ${newJobs.length} jobs, found ${duplicateJobsCheck?.length}`);
    }
    console.log("✅ Duplicate prevention verified (count remained unchanged).");

    // Step 4: Queue Cancellation Receipt
    console.log("\n[Test 4] Queueing Order Cancellation Slip...");
    await PrintingService.queueOrderCancellationPrint(mockOrderWithItems, 'Customer requested order cancellation');

    const { data: cancelJob } = await supabaseServer
      .from('print_jobs')
      .select('*')
      .eq('order_id', testOrderId)
      .eq('target_printer', 'cancellation')
      .maybeSingle();

    if (!cancelJob) throw new Error("Cancellation print job was not created!");
    console.log("✅ Cancellation slip successfully queued with header:", JSON.parse(cancelJob.esc_pos_data).header);

    // Step 5: Clean up test entries
    console.log("\n[Test 5] Cleaning up test data...");
    await supabaseServer.from('print_jobs').delete().eq('order_id', testOrderId);
    await supabaseServer.from('orders').delete().eq('id', testOrderId);
    console.log("✅ Cleanup complete.");

    console.log("\n=================================================");
    console.log("🎉 ALL PRINT SYSTEM HARDENING TESTS PASSED 100%");
    console.log("=================================================");

  } catch (err: any) {
    console.error("\n❌ PRINT TEST FAILED:", err.message);
    // Emergency cleanup
    await supabaseServer.from('print_jobs').delete().eq('order_id', testOrderId);
    await supabaseServer.from('orders').delete().eq('id', testOrderId);
    process.exit(1);
  }
}

runPrintSystemHardeningTests();
