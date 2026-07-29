import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { getShiprocketToken } from '../src/lib/services/shiprocket/auth';

async function addPickupAddressAndTestOrder() {
  console.log("==================================================");
  console.log("📍 REGISTERING VALID SHIPROCKET PICKUP ADDRESS");
  console.log("==================================================");

  try {
    const authRes = await getShiprocketToken();
    if (!authRes.success || !authRes.token) {
      throw new Error("Failed to authenticate with Shiprocket API");
    }

    const token = authRes.token;

    // 1. Add Pickup Address to Shiprocket Account via API
    console.log("\n1. Adding Pickup Address 'Primary' to Shiprocket...");
    const addPickupRes = await fetch('https://apiv2.shiprocket.in/v1/external/settings/company/addpickup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        pickup_location: "Primary",
        name: "Mehta Sweet Mart",
        email: "orders@mehtadairy.com",
        phone: "9913252232",
        address: "Shop No. 1, Mehta Sweet Mart, Station Road",
        address_2: "Opposite Tower Clock",
        city: "Navsari",
        state: "Gujarat",
        country: "India",
        pin_code: "396001"
      })
    });

    const addPickupData = await addPickupRes.json();
    console.log("Add Pickup Location Response:", JSON.stringify(addPickupData, null, 2));

    // 2. Test Order Creation with channel_id 11648558
    console.log("\n2. Testing Order Creation with channel_id 11648558 & pickup_location 'Primary'...");

    const testPayload = {
      order_id: `MEHTA-${Date.now().toString().slice(-6)}`,
      order_date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      pickup_location: "Primary",
      channel_id: "11648558",
      comment: "Mehta Sweet Mart Online Order",
      billing_customer_name: "Customer",
      billing_last_name: "Test",
      billing_address: "Flat 101, Station Road",
      billing_city: "Navsari",
      billing_pincode: "396001",
      billing_state: "Gujarat",
      billing_country: "India",
      billing_email: "orders@mehtadairy.com",
      billing_phone: "9913252232",
      shipping_is_billing: true,
      order_items: [{
        name: "Special Kaju Katli",
        sku: "KAJU_500G",
        units: 1,
        selling_price: 500,
        discount: 0,
        tax: 0,
        hsn: 2106
      }],
      payment_method: "Prepaid",
      shipping_charges: 50,
      sub_total: 500,
      length: 15,
      breadth: 15,
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

    if (createRes.ok && (createData?.order_id || createData?.shipment_id)) {
      console.log("\n==================================================");
      console.log("🎉 SUCCESS! ORDER CREATED IN YOUR SHIPROCKET DASHBOARD!");
      console.log(`Order ID: ${createData.order_id}, Shipment ID: ${createData.shipment_id}`);
      console.log("==================================================");
    } else {
      console.error("\n❌ ORDER CREATION FAILED:", createData);
    }

  } catch (err: any) {
    console.error("\n❌ SCRIPT FAILED:", err.message);
  }
}

addPickupAddressAndTestOrder();
