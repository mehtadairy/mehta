const http = require('http');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function simulateOrderFlow() {
  console.log("=== STARTING ORDER SIMULATION ===");

  const draftId = crypto.randomUUID();
  const rawPayload = {
    id: draftId,
    order_number: null, // intentionally null as frontend does
    subtotal: 500,
    discount: 0,
    delivery_charge: 50,
    total: 550,
    user_name: "Test User",
    user_phone: "9876543210",
    user_email: "test@example.com",
    shipping_address: {
      name: "Test User",
      phone: "9876543210",
      line1: "123 Test Street",
      line2: "Test Area",
      landmark: "Near Test",
      city: "Test City",
      state: "Test State",
      pincode: "123456",
      country: "India"
    }
  };

  const orderItems = [
    {
      product_id: 1,
      product_name: "Test Sweets",
      price: 250,
      quantity: 2,
      weight: "500g"
    }
  ];

  console.log(`1. Frontend initiates checkout for Order ID: ${draftId}`);
  
  // Fake Razorpay Success Response
  const fakeRazorpayOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;
  const fakeRazorpayPaymentId = `pay_${crypto.randomBytes(8).toString('hex')}`;
  const secret = process.env.RAZORPAY_KEY_SECRET || "dummy_secret";
  
  const generatedSignature = crypto
    .createHmac("sha256", secret)
    .update(fakeRazorpayOrderId + "|" + fakeRazorpayPaymentId)
    .digest("hex");

  console.log(`2. Fake Razorpay Payment Success!`);
  console.log(`   - RZP Order: ${fakeRazorpayOrderId}`);
  console.log(`   - RZP Payment: ${fakeRazorpayPaymentId}`);

  // Call /api/payment/verify natively (since it's a Next.js App Router we could use fetch if dev server is up)
  // Let's call the local dev server directly
  console.log("3. Calling /api/payment/verify...");
  
  try {
    const res = await fetch("http://localhost:3000/api/payment/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        razorpay_order_id: fakeRazorpayOrderId,
        razorpay_payment_id: fakeRazorpayPaymentId,
        razorpay_signature: generatedSignature,
        orderPayload: rawPayload,
        orderItems: orderItems
      })
    });

    const data = await res.json();
    console.log("   Verify Response:", data);

    if (!data.success) {
      console.error("   ❌ Verification returned failure. Test Aborted.");
      return;
    }

    // 4. Verification DB Check
    console.log("4. Querying Database for persistence proof...");
    const { data: dbOrder, error: dbErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', draftId)
      .single();

    if (dbErr || !dbOrder) {
      console.error("   ❌ Order not found in database! Persistence failed.");
    } else {
      console.log(`   ✅ Order found! Order Number: ${dbOrder.order_number}`);
      console.log(`   ✅ Address saved? ${!!dbOrder.shipping_address}`);
      console.log(`   ✅ Payment Status: ${dbOrder.payment_status}`);
      console.log(`   ✅ Razorpay Payment ID: ${dbOrder.payment_id}`);
    }

    const { data: dbItems, error: itemErr } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', draftId);

    if (itemErr || !dbItems || dbItems.length === 0) {
      console.error("   ❌ Order items not found in database! Persistence failed.");
    } else {
      console.log(`   ✅ Order items found! Count: ${dbItems.length}`);
    }

    console.log("=== SIMULATION COMPLETE ===");

  } catch (err) {
    console.error("Simulation error:", err);
  }
}

simulateOrderFlow();
