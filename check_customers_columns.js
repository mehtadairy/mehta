const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { data, error } = await supabase.from('customers').select('*').limit(1);
  if (error) {
    console.log('Error querying customers:', error.message);
  } else {
    console.log('Customers columns:', data.length > 0 ? Object.keys(data[0]) : "No data. Attempting to select columns via RPC or fallback.");
    // Let's insert a dummy query or try to see if we can get schema info.
  }
}
check();
