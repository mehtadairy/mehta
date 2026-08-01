require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTables() {
  console.log("Checking DB tables...");
  const { data: adminData, error: adminErr } = await supabase.from('admin_users').select('*').limit(1);
  console.log("admin_users:", adminErr ? adminErr.message : adminData);

  const { data: staffData, error: staffErr } = await supabase.from('staff_accounts').select('*').limit(1);
  console.log("staff_accounts:", staffErr ? staffErr.message : staffData);

  const { data: lockData, error: lockErr } = await supabase.from('account_locks').select('*').limit(1);
  console.log("account_locks:", lockErr ? lockErr.message : lockData);
}

testTables();
