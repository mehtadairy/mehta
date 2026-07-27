require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { data, error } = await supabase.from('payments').select('*').limit(1);
  console.log('Payments data:', data);
  console.log('Payments error:', error);
  
  const { data: nData, error: nError } = await supabase.from('notification_logs').select('*').limit(1);
  console.log('Notifications error:', nError);
}
check();
