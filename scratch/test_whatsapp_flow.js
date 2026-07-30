const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function runTest() {
  console.log("=== START WHATSAPP FLOW AUDIT TEST ===");

  // 1. Fetch a product from DB to order
  const { data: products, error: pErr } = await supabase
    .from('products')
    .select('id, name, prices')
    .limit(1);

  if (pErr || !products || products.length === 0) {
    console.error("Failed to fetch product for test:", pErr);
    process.exit(1);
  }

  const testProduct = products[0];
  console.log(`Using product for test: ${testProduct.name} (ID: ${testProduct.id})`);

  // Generate a random phone number to prevent collisions
  const rand = Math.floor(1000000000 + Math.random() * 9000000000);
  const testPhone = `91${String(rand).slice(-10)}`;
  const testName = `Test WA Customer ${Date.now()}`;

  // 2. Call Customer API
  console.log("\n--- STEP 1: Calling Customer API ---");
  const customerPayload = {
    customerName: testName,
    phone: testPhone,
    address: "Mehta Sweet Mart, Jamnagar Road",
    pincode: "361001"
  };

  const custRes = await fetch("http://localhost:3000/api/whatsapp/customer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(customerPayload)
  });

  const custData = await custRes.json();
  console.log("Customer API Status:", custRes.status);
  console.log("Customer API Response:", JSON.stringify(custData, null, 2));

  if (!custData.success || !custData.customerId) {
    console.error("Customer API failed.");
    process.exit(1);
  }

  const customerId = custData.customerId;

  // 3. Call Create Order API
  console.log("\n--- STEP 2: Calling Create Order API ---");
  const orderPayload = {
    customerId: customerId,
    phone: testPhone,
    customerName: testName,
    address: "Mehta Sweet Mart, Jamnagar Road",
    pincode: "361001",
    cartData: [
      {
        productId: testProduct.id,
        quantity: 1,
        price: Object.values(testProduct.prices)[0]
      }
    ]
  };

  const orderRes = await fetch("http://localhost:3000/api/whatsapp/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderPayload)
  });

  const orderData = await orderRes.json();
  console.log("Create Order API Status:", orderRes.status);
  console.log("Create Order API Response:", JSON.stringify(orderData, null, 2));

  if (!orderData.success || !orderData.orderId) {
    console.error("Create Order API failed.");
    process.exit(1);
  }

  const orderId = orderData.orderId;

  // 4. Call Invoice API
  console.log("\n--- STEP 3: Calling Invoice API ---");
  const invoicePayload = {
    customerId: customerId,
    orderId: orderId
  };

  const invoiceRes = await fetch("http://localhost:3000/api/whatsapp/invoice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(invoicePayload)
  });

  const invoiceData = await invoiceRes.json();
  console.log("Invoice API Status:", invoiceRes.status);
  console.log("Invoice API Response:", JSON.stringify(invoiceData, null, 2));

  // 5. Verify database records
  console.log("\n--- STEP 4: Verifying database records ---");
  const { data: dbOrder, error: dbOrderErr } = await supabase
    .from('orders')
    .select('*, order_items(*), invoices(*)')
    .eq('id', orderId)
    .single();

  if (dbOrderErr) {
    console.error("Order not found in DB:", dbOrderErr);
  } else {
    console.log("Database Order Row:");
    console.log(JSON.stringify(dbOrder, null, 2));
  }

  console.log("=== TEST COMPLETED ===");
}

runTest();
