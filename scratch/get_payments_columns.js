const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'payments' });
  if (error) {
    // If no RPC, try selecting from a view or information_schema if permitted, otherwise we can try doing a general check
    console.log('RPC get_table_columns error:', error.message);
    // Let's try querying information_schema via a postgrest direct call if it's open, but it's likely RLS protected.
    // Instead let's write a query using supabase sql editor equivalent or check if we can inspect via query.
  } else {
    console.log('Columns:', data);
  }
}
check();
