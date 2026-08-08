const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const paymentCols = ['id', 'order_id', 'amount', 'status', 'payment_method', 'razorpay_payment_id', 'created_at'];
const refundCols = ['id', 'order_id', 'payment_id', 'razorpay_refund_id', 'amount', 'currency', 'status', 'reason', 'created_at', 'processed_at', 'failed_at', 'failure_reason', 'reversed_at', 'reversal_reason', 'metadata'];

async function check() {
  console.log('--- CHECKING PAYMENTS COLUMNS ---');
  for (const col of paymentCols) {
    const { error } = await supabase.from('payments').select(col).limit(1);
    if (error) {
      console.log(`Column payments.${col}: ❌ ERROR: ${error.message}`);
    } else {
      console.log(`Column payments.${col}: ✅ EXISTS`);
    }
  }

  console.log('\n--- CHECKING REFUNDS COLUMNS ---');
  for (const col of refundCols) {
    const { error } = await supabase.from('refunds').select(col).limit(1);
    if (error) {
      console.log(`Column refunds.${col}: ❌ ERROR: ${error.message}`);
    } else {
      console.log(`Column refunds.${col}: ✅ EXISTS`);
    }
  }
}

check();
