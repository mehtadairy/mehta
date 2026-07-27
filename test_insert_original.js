const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data, error } = await supabase.from('addresses').insert([{
    customer_id: '00000000-0000-0000-0000-000000000000',
    name: 'Test Name',
    phone: '1234567890',
    street: '123 Test St',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '380015',
    is_default: true
  }]).select();
  console.log('Result:', data, error);
}

run();
