const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { data, error } = await supabase.from('payments').select('*').limit(1);
  if (error) {
    console.log('Error querying payments:', error.message);
  } else {
    console.log('Payments columns:', data.length > 0 ? Object.keys(data[0]) : "No data to check columns.");
  }
}
check();
