require('dotenv').config({path: '.env.local'});
const {createClient} = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
supabase.from('categories').select('*').then(r => console.log(JSON.stringify(r.data, null, 2)));
