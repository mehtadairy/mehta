import { supabase } from './src/lib/supabaseClient';

async function run() {
  const { data, error } = await supabase.from('orders').select('*').limit(1);
  console.log('orders:', data, error);
  
  const { data: d2, error: e2 } = await supabase.from('order_items').select('*').limit(1);
  console.log('order_items:', d2, e2);
  
  const { data: d3, error: e3 } = await supabase.from('categories').select('*').limit(1);
  console.log('categories:', d3, e3);
  
  const { data: d4, error: e4 } = await supabase.from('banners').select('*').limit(1);
  console.log('banners:', d4, e4);
}

run();
