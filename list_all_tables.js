const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data, error } = await supabase.rpc('get_tables'); // Check if there is an RPC
  if (error) {
    console.log('RPC get_tables error:', error.message);
    
    // Fallback: Query pg_class or pg_namespace via postgrest if allowed, or check standard endpoints
    const tables = ['products', 'categories', 'banners', 'orders', 'order_items', 'addresses', 'customers', 'delivery_zones', 'ingredients', 'product_ingredients', 'payments'];
    for (const t of tables) {
      const { error: err } = await supabase.from(t).select('*').limit(1);
      if (err) {
        console.log(`- Table "${t}": NOT ACCESSIBLE (${err.message})`);
      } else {
        console.log(`- Table "${t}": EXISTS`);
      }
    }
  } else {
    console.log('Tables from RPC:', data);
  }
}

run();
