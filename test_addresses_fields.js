const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data, error } = await supabase.from('addresses').insert([{
    full_name: 'Test Name',
    mobile: '1234567890',
    street: '123 Test St',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '380015',
    is_default: true
  }]).select();
  console.log('Result:', data, error);
}

run();
