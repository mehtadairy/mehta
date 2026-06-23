const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testUpdate() {
  const { data: orders, error: fetchErr } = await supabase.from('orders').select('*').limit(1);
  if (fetchErr || !orders || orders.length === 0) {
    console.log("Fetch error or no orders:", fetchErr);
    return;
  }
  
  const order = orders[0];
  console.log("Updating order ID:", order.id, "current status:", order.status);
  
  const { data, error } = await supabase.from('orders').update({
    status: 'Delivered'
  }).eq('id', order.id).select();
  
  if (error) {
    console.log("Update Error:", error);
  } else {
    console.log("Update Success:", data);
  }
}

testUpdate();
