import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { createShiprocketOrder } from '../src/lib/services/shiprocket/shipment';
import { supabaseServer as supabase } from '../src/lib/supabaseServer';

async function testFullOrderSync() {
  console.log("==================================================");
  console.log("🚀 TESTING END-TO-END SHIPROCKET ORDER SYNC");
  console.log("==================================================");

  try {
    // 1. Create a test order in Supabase
    const orderNum = `ORD-SR-${Date.now().toString().slice(-5)}`;
    console.log(`\n1. Creating order ${orderNum} in Supabase DB...`);

    const { data: newOrder, error: insertErr } = await supabase
      .from('orders')
      .insert([{
        order_number: orderNum,
        status: 'Processing',
        payment_status: 'Paid',
        payment_method: 'Online',
        user_name: 'Arjun Parmar',
        user_phone: '6351561018',
        user_email: 'orders@mehtadairy.com',
        shipping_address: {
          name: 'Arjun Parmar',
          phone: '6351561018',
          flat: 'Shop 101',
          street: 'Station Road',
          city: 'Navsari',
          state: 'Gujarat',
          pincode: '396001'
        },
        subtotal: 500,
        delivery_charge: 50,
        total: 550,
        delivery_type: 'Home Delivery'
      }])
      .select()
      .single();

    if (insertErr || !newOrder) {
      throw new Error("Failed to insert test order: " + insertErr?.message);
    }

    console.log("Order created in DB with ID:", newOrder.id);

    // Insert order items
    await supabase.from('order_items').insert([{
      order_id: newOrder.id,
      product_name: 'Premium Kaju Katli',
      quantity: 1,
      price: 500,
      weight: '500g'
    }]);

    // 2. Call createShiprocketOrder
    console.log("\n2. Executing createShiprocketOrder service...");
    const result = await createShiprocketOrder(newOrder.id);
    console.log("\nShipment Creation Result:", JSON.stringify(result, null, 2));

    if (result.success && !result.isFallback && result.shiprocketOrderId) {
      console.log("\n==================================================");
      console.log("🎉 SUCCESS! LIVE ORDER CREATED IN SHIPROCKET DASHBOARD!");
      console.log(`Shiprocket Order ID: ${result.shiprocketOrderId}`);
      console.log(`Shipment ID: ${result.shipmentId}`);
      console.log(`AWB Number: ${result.awbNumber || 'Assigned / Auto-assigning'}`);
      console.log("==================================================");
    } else {
      console.error("\n❌ SHIPMENT FAILED:", result.error);
    }

  } catch (err: any) {
    console.error("\n❌ TEST FAILED:", err.message);
  }
}

testFullOrderSync();
