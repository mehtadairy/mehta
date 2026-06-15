const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const candidates = [
  'id',
  'order_number',
  'created_at',
  'status',
  'subtotal',
  'discount',
  'delivery_charge',
  'total',
  'shipping_address',
  'payment_method',
  'payment_status',
  'razorpay_order_id',
  'razorpay_payment_id',
  
  // Potential contact columns
  'full_name',
  'name',
  'mobile',
  'phone',
  'email',
  'customer_id',
  'user_id',
  
  // Potential coupon columns
  'coupon_code',
  'coupon',
  'promo_code',
  
  // Potential payment columns
  'payment_id',
  'transaction_id',
  
  // Check other possible spelling
  'discount_amount',
  'shipping_charge',
  'delivery_charge_amount',
  'address',
  'landmark',
  'city',
  'state',
  'pincode'
];

async function run() {
  console.log('Probing orders table columns...');
  const results = {};
  for (const col of candidates) {
    const { error } = await supabase.from('orders').select(col).limit(1);
    if (error) {
      if (error.message.includes('column orders.')) {
        results[col] = '❌ DOES NOT EXIST';
      } else {
        results[col] = '⚠️ ERROR: ' + error.message;
      }
    } else {
      results[col] = '✅ EXISTS';
    }
  }
  console.log(results);
}

run();
