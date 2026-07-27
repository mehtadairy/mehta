const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data: res1, error: err1 } = await supabase.from('addresses').select('street').limit(1);
  console.log('Street select error:', err1 ? err1.message : 'Success');
  
  const { data: res2, error: err2 } = await supabase.from('addresses').select('address').limit(1);
  console.log('Address select error:', err2 ? err2.message : 'Success');
}

run();
