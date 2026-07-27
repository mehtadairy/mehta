const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const candidateColumns = [
  'id',
  'order_number',
  'user_name',
  'user_phone',
  'user_email',
  'subtotal',
  'discount',
  'coupon_code',
  'coupon',
  'coupon_id',
  'promo_code',
  'delivery_charge',
  'total',
  'shipping_address',
  'payment_method',
  'payment_status',
  'status',
  'created_at',
  'payment_id'
];

async function diagnose() {
  console.log('Testing column names on orders table...');
  for (const col of candidateColumns) {
    const { data, error } = await supabase.from('orders').select(col).limit(1);
    if (error) {
      if (error.message.includes('Could not find')) {
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
