const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  // Test inserting customer without phone
  const testEmail = `test_${Date.now()}@example.com`;
  console.log('Testing inserting customer with email:', testEmail);
  
  const { data, error } = await supabase
    .from('customers')
    .insert([{ name: 'Test OAuth User', email: testEmail }])
    .select();

  console.log('Insert Result:', data, error);

  if (error) {
    console.error('Insert failed:', error.message);
  } else {
    console.log('Insert succeeded! Cleaning up test user...');
    const { error: delErr } = await supabase
      .from('customers')
      .delete()
      .eq('id', data[0].id);
    console.log('Cleanup Result:', delErr);
  }
}

run();
