require('dotenv').config({ path: '.env.local' });

async function run() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error('Missing URL or Key');
    return;
  }

  try {
    const res = await fetch(`${url}/rest/v1/`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    });

    if (!res.ok) {
      console.error('HTTP Error:', res.status, res.statusText);
      console.error(await res.text());
      return;
    }

    const data = await res.json();
    console.log('--- PostgREST Schema Tables ---');
    if (data.paths) {
      const paths = Object.keys(data.paths);
      console.log('Available endpoints/tables:', paths);
      
      // Let's inspect 'customers' and 'addresses' specifically if they are there
      console.log('\n--- Details of paths ---');
      paths.forEach(p => {
        if (p.includes('customers') || p.includes('addresses') || p.includes('delivery_zones')) {
          console.log(`Path: ${p}`);
        }
      });
      
      if (data.definitions) {
        console.log('\n--- Definitions (Tables and Columns) ---');
        Object.keys(data.definitions).forEach(tableName => {
          console.log(`\nTable: ${tableName}`);
          const props = data.definitions[tableName].properties;
          if (props) {
            console.log('Columns:', Object.keys(props));
          }
        });
      }
    } else {
      console.log('No paths found in OpenAPI spec.');
    }
  } catch (error) {
    console.error('Fetch failed:', error);
  }
}

run();
