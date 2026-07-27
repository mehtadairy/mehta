const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data, error } = await supabase.from('printer_settings').select('*');
  if (error) {
    console.error('Error fetching printer_settings:', error.message);
  } else {
    console.log('Printer Settings Status:', data);
  }
}

run();
