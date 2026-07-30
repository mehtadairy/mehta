const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function run() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const res = await fetch(url, {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`
    }
  });
  const json = await res.json();
  
  console.log("TABLES AND COLUMNS:");
  const definitions = json.definitions || {};
  for (const table in definitions) {
    console.log(`\nTable: ${table}`);
    const properties = definitions[table].properties || {};
    console.log("Columns:", Object.keys(properties).join(', '));
  }
}

run().catch(console.error);
