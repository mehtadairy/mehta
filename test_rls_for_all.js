const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const dummyUUID1 = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
  const dummyUUID2 = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';

  console.log('--- TESTING ANONYMOUS INSERTS FOR RLS POLICIES ---');

  // Test 1: customers
  console.log('\nTesting insert into "customers"...');
  const { data: customerData, error: customerError } = await supabase
    .from('customers')
    .insert([{
      id: dummyUUID1,
      phone: '9999999999',
      name: 'RLS Test User',
      email: 'rlstest@example.com',
      role: 'customer'
    }])
    .select();
  console.log('Result:', customerData ? 'Success' : 'Fail');
  if (customerError) console.error('Error:', customerError.message);

  // Test 2: orders
  console.log('\nTesting insert into "orders"...');
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert([{
      id: dummyUUID2,
      order_number: 'ORD-TEST-999999',
      subtotal: 100,
      discount: 0,
      delivery_charge: 0,
      total: 100,
      shipping_address: { name: 'Test' },
      payment_method: 'COD',
      payment_status: 'Pending',
      status: 'Pending',
      customer_id: customerData ? dummyUUID1 : null
    }])
    .select();
  console.log('Result:', orderData ? 'Success' : 'Fail');
  if (orderError) console.error('Error:', orderError.message);

  // Test 3: order_items
  console.log('\nTesting insert into "order_items"...');
  const { data: dbProds } = await supabase.from('products').select('id').limit(1);
  const realProductId = dbProds && dbProds.length > 0 ? dbProds[0].id : 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';
  
  const { data: itemsData, error: itemsError } = await supabase
    .from('order_items')
    .insert([{
      order_id: dummyUUID2,
      product_id: realProductId,
      product_name: 'Test Product',
      weight: '500g',
      quantity: 1,
      price: 100
    }])
    .select();
  console.log('Result:', itemsData ? 'Success' : 'Fail');
  if (itemsError) console.error('Error:', itemsError.message);

  // Test 4: payments
  console.log('\nTesting insert into "payments"...');
  const { data: paymentData, error: paymentError } = await supabase
    .from('payments')
    .insert([{
      order_id: dummyUUID2,
      payment_id: 'PAY-TEST-999999',
      amount: 100,
      method: 'COD',
      status: 'pending'
    }])
    .select();
  console.log('Result:', paymentData ? 'Success' : 'Fail');
  if (paymentError) console.error('Error:', paymentError.message);

  // Test 5: payment_recovery
  console.log('\nTesting insert into "payment_recovery"...');
  const { data: recoveryData, error: recoveryError } = await supabase
    .from('payment_recovery')
    .insert([{
      payment_id: 'PAY-RECOV-999999',
      amount: 10000,
      status: 'pending',
      failure_reason: 'RLS Test'
    }])
    .select();
  console.log('Result:', recoveryData ? 'Success' : 'Fail');
  if (recoveryError) console.error('Error:', recoveryError.message);

  console.log('\n--- CLEANING UP ---');
  if (itemsData) {
    const { error } = await supabase.from('order_items').delete().eq('order_id', dummyUUID2);
    console.log('Delete order_items result:', error ? error.message : 'Success');
  }
  if (paymentData) {
    const { error } = await supabase.from('payments').delete().eq('order_id', dummyUUID2);
    console.log('Delete payments result:', error ? error.message : 'Success');
  }
  if (orderData) {
    const { error } = await supabase.from('orders').delete().eq('id', dummyUUID2);
    console.log('Delete orders result:', error ? error.message : 'Success');
  }
  if (customerData) {
    const { error } = await supabase.from('customers').delete().eq('id', dummyUUID1);
    console.log('Delete customers result:', error ? error.message : 'Success');
  }
  if (recoveryData) {
    const { error } = await supabase.from('payment_recovery').delete().eq('payment_id', 'PAY-RECOV-999999');
    console.log('Delete payment_recovery result:', error ? error.message : 'Success');
  }
}

run();
