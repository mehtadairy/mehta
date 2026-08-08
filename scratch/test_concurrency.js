const { createClient } = require('@supabase/supabase-js');

// Load environment variables for the test
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runConcurrencyTest() {
  console.log("Starting concurrency test with 10 simultaneous requests...");
  
  // Fire 10 requests at the exact same millisecond
  const promises = Array.from({ length: 10 }).map(() => supabase.rpc('generate_daily_order_number'));
  
  const results = await Promise.all(promises);
  
  // Extract just the order numbers
  const orderNumbers = results.map(r => r.data);
  
  console.log("Generated Order Numbers:");
  orderNumbers.forEach((num, index) => console.log(`[Request ${index + 1}] -> ${num}`));
  
  // Check for errors
  const errors = results.filter(r => r.error);
  if (errors.length > 0) {
    console.error("Errors occurred during generation:", errors.map(e => e.error));
  }
  
  // Check for duplicates using a Set
  const uniqueNumbers = new Set(orderNumbers);
  
  console.log("\n--- Verification ---");
  console.log(`Total Requests: 10`);
  console.log(`Unique Order Numbers Generated: ${uniqueNumbers.size}`);
  
  if (uniqueNumbers.size === 10) {
    console.log("✅ PASS: Zero duplicates detected! The sequence is atomic and transaction-safe.");
  } else {
    console.error(`❌ FAIL: Duplicates detected! Only generated ${uniqueNumbers.size} unique numbers.`);
  }
}

runConcurrencyTest();
