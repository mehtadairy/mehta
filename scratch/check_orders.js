const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  const { data: orders, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5);
  console.log("Orders:", orders);
  if (error) console.error("Error:", error);
  
  const { data: customers, err2 } = await supabase.from('customers').select('*').order('created_at', { ascending: false }).limit(5);
  console.log("Customers:", customers);
}
main();
