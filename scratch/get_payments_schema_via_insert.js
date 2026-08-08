const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  // Get a valid order_id
  const { data: orders, error: orderErr } = await supabase.from('orders').select('id').limit(1);
  if (orderErr || !orders || orders.length === 0) {
    console.error('Error fetching order:', orderErr?.message || 'No orders');
    return;
  }
  const orderId = orders[0].id;
  console.log('Using order ID:', orderId);

  // Try inserting a dummy payment
  const dummyPayload = {
    order_id: orderId,
    amount: 10,
    status: 'captured'
  };

  const { data: inserted, error: insertErr } = await supabase
    .from('payments')
    .insert([dummyPayload])
    .select();

  if (insertErr) {
    console.error('Insert error:', insertErr.message);
  } else if (inserted && inserted.length > 0) {
    console.log('Successfully inserted payment!');
    console.log('Payments table columns:', Object.keys(inserted[0]));
    
    // Clean up
    const { error: deleteErr } = await supabase.from('payments').delete().eq('id', inserted[0].id);
    if (deleteErr) {
      console.error('Failed to clean up dummy payment:', deleteErr.message);
    } else {
      console.log('Cleaned up dummy payment.');
    }
  } else {
    console.log('No data returned on insert.');
  }
}

run();
