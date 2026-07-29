import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { getShiprocketToken } from '../src/lib/services/shiprocket/auth';

async function testShiprocketAccountDetails() {
  console.log("==================================================");
  console.log("🔍 AUDITING SHIPROCKET ACCOUNT PICKUP LOCATIONS & CHANNELS");
  console.log("==================================================");

  try {
    const authRes = await getShiprocketToken();
    if (!authRes.success || !authRes.token) {
      throw new Error("Failed to authenticate with Shiprocket API");
    }

    const token = authRes.token;

    // 1. Fetch Registered Pickup Locations
    console.log("\n1. Fetching Pickup Locations from Shiprocket...");
    const pickupRes = await fetch('https://apiv2.shiprocket.in/v1/external/settings/company/pickup', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const pickupData = await pickupRes.json();
    console.log("Pickup Locations Response:", JSON.stringify(pickupData, null, 2));

    // 2. Fetch Channels
    console.log("\n2. Fetching Channels from Shiprocket...");
    const channelRes = await fetch('https://apiv2.shiprocket.in/v1/external/channels', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const channelData = await channelRes.json();
    console.log("Channels Response:", JSON.stringify(channelData, null, 2));

    // 3. Test Creating an Order with the First Pickup Location
    const addresses = pickupData?.data?.shipping_address || [];
    const pickupLocationName = addresses[0]?.pickup_location || 'Primary';
    console.log(`\n3. Testing Order Creation with pickup_location: '${pickupLocationName}'...`);

    const testPayload = {
      order_id: `TEST-ORDER-${Date.now()}`,
      order_date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      pickup_location: pickupLocationName,
      comment: "API Diagnostics Order",
      billing_customer_name: "Test",
      billing_last_name: "Customer",
      billing_address: "123 Main Street",
      billing_city: "Navsari",
      billing_pincode: "396001",
      billing_state: "Gujarat",
      billing_country: "India",
      billing_email: "test@mehtadairy.com",
      billing_phone: "9913252232",
      shipping_is_billing: true,
      order_items: [{
        name: "Test Sweet Box",
        sku: "TEST_SWEET",
        units: 1,
        selling_price: 100
      }],
      payment_method: "Prepaid",
      shipping_charges: 0,
      sub_total: 100,
      length: 10,
      breadth: 10,
      height: 10,
      weight: 0.5
    };

    const createRes = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testPayload)
    });

    const createData = await createRes.json();
    console.log("\nCreate Order Response:", JSON.stringify(createData, null, 2));

    if (createRes.ok && createData?.order_id) {
      console.log("\n🎉 TEST ORDER SUCCESSFULLY CREATED IN SHIPROCKET ACCOUNT!");
      console.log(`Shiprocket Order ID: ${createData.order_id}, Shipment ID: ${createData.shipment_id}`);
    } else {
      console.error("\n❌ CREATE ORDER FAILED:", createData?.message || createData);
    }

  } catch (err: any) {
    console.error("\n❌ TEST FAILED:", err.message);
  }
}

testShiprocketAccountDetails();
