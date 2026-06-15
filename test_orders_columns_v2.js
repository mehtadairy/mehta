const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const candidateColumns = [
  'customer_id',
  'customer_name',
  'customer_phone',
  'customer_email',
  'phone',
  'mobile',
  'email',
  'name',
  'user_id',
  'payment_id',
  'transaction_id',
  'rzp_order_id',
  'razorpay_order_id',
  'razorpay_payment_id',
  'coupon_code',
  'coupon'
];

async function diagnose() {
  console.log('Testing customer/payment column names on orders table...');
  for (const col of candidateColumns) {
    const { data, error } = await supabase.from('orders').select(col).limit(1);
    if (error) {
      if (error.message.includes('column orders.')) {
        console.log(`❌ Column '${col}' DOES NOT EXIST`);
      } else {
        console.log(`⚠️ Column '${col}' error:`, error.message);
      }
    } else {
      console.log(`✅ Column '${col}' EXISTS`);
    }
  }
}

diagnose();
