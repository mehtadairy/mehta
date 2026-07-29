import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { PrintingService } from '@/lib/services/printing';

export async function GET() {
  const testOrderId = `TEST-PRINT-${Date.now()}`;
  const testOrderNumber = `ORD-PRNT-${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    // Step 1: Create mock order in DB
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

    // Step 2: Queue standard print jobs
    const mockOrderWithItems = {
      ...mockOrder,
      items: [{ productName: 'Kesar Peda', quantity: 2, weight: '500g', price: 250 }]
    };
    await PrintingService.queueOrderPrints(mockOrderWithItems, 'Main');

    const { data: newJobs } = await supabaseServer
      .from('print_jobs')
      .select('*')
      .eq('order_id', testOrderId);

    // Step 3: Test Idempotency
    await PrintingService.queueOrderPrints(mockOrderWithItems, 'Main');
    const { data: duplicateJobsCheck } = await supabaseServer
      .from('print_jobs')
      .select('*')
      .eq('order_id', testOrderId);

    const idempotencyPassed = duplicateJobsCheck?.length === newJobs?.length;

    // Step 4: Queue Cancellation Receipt
    await PrintingService.queueOrderCancellationPrint(mockOrderWithItems, 'Customer requested order cancellation');

    const { data: cancelJob } = await supabaseServer
      .from('print_jobs')
      .select('*')
      .eq('order_id', testOrderId)
      .eq('target_printer', 'cancellation')
      .maybeSingle();

    // Step 5: Clean up test entries
    await supabaseServer.from('print_jobs').delete().eq('order_id', testOrderId);
    await supabaseServer.from('orders').delete().eq('id', testOrderId);

    return NextResponse.json({
      success: true,
      testOrderNumber,
      queuedJobs: newJobs?.map(j => j.target_printer),
      idempotencyPassed,
      cancellationJobHeader: cancelJob ? JSON.parse(cancelJob.esc_pos_data).header : null
    });

  } catch (err: any) {
    await supabaseServer.from('print_jobs').delete().eq('order_id', testOrderId);
    await supabaseServer.from('orders').delete().eq('id', testOrderId);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
