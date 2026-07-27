const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const orderId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const payload = {
    id: orderId,
    order_number: `ORD-TEST-${Math.floor(100000 + Math.random() * 900000)}`,
    subtotal: 100,
    discount: 0,
    delivery_charge: 50,
    total: 150,
    shipping_address: { name: 'Test', phone: '9876543210', street: '123 Test St', city: 'Test City', state: 'Test State', pincode: '123456' },
    payment_method: 'COD',
    payment_status: 'Pending',
    status: 'Pending'
  };
  console.log('Inserting mock order payload...');
  const { data, error } = await supabase.from('orders').insert([payload]).select();
  console.log('Insert Result:', data, error);
  if (data) {
    console.log('Success! Deleting mock order...');
    await supabase.from('orders').delete().eq('id', orderId);
  }
}
run();
