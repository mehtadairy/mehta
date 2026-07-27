const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  console.log('Checking orders table cancellation columns...');
  const { data, error } = await supabase.from('orders').select('cancelled_by, cancelled_at, cancellation_reason').limit(1);
  if (error) {
    console.error('❌ Orders columns error:', error.message);
  } else {
    console.log('✅ Orders columns exist!');
  }

  console.log('Checking order_cancellations table...');
  const { data: cancelData, error: cancelError } = await supabase.from('order_cancellations').select('*').limit(1);
  if (cancelError) {
    console.error('❌ order_cancellations table error:', cancelError.message);
  } else {
    console.log('✅ order_cancellations table exists!');
  }
}

check();
