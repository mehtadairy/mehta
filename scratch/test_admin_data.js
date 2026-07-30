const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const { createClient } = require('@supabase/supabase-js');
const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Constants (UPDATED to match production schema)
const ORDER_FIELDS = 'id, order_number, user_name, user_phone, user_email, total, status, payment_status, shipment_status, created_at, shipping_address';
const ORDER_ITEMS_FIELDS = 'id, product_id, product_name, quantity, price, weight';
const INVOICE_FIELDS = 'id, invoice_number, order_id, pdf_url, created_at';
const CUSTOMER_FIELDS = 'id, name, phone, email, created_at, profile_image';

async function run() {
  console.log("Starting parallel queries...");
  try {
    const [
      ordersResult,
      customersResult,
      paymentsResult,
      invoicesResult,
      notificationsResult,
      recoveryResult,
    ] = await Promise.all([
      supabaseServer
        .from('orders')
        .select(`${ORDER_FIELDS}, order_items(${ORDER_ITEMS_FIELDS}), invoices(${INVOICE_FIELDS})`, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(0, 49),

      supabaseServer
        .from('customers')
        .select(CUSTOMER_FIELDS, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(0, 49),

      supabaseServer
        .from('payments')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(0, 49),

      supabaseServer
        .from('invoices')
        .select(INVOICE_FIELDS, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(0, 49),

      supabaseServer
        .from('notification_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),

      supabaseServer
        .from('payment_recovery')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200),
    ]);

    console.log("Orders count:", ordersResult.data ? ordersResult.data.length : 0, "Error:", ordersResult.error);
    console.log("Customers count:", customersResult.data ? customersResult.data.length : 0, "Error:", customersResult.error);
    console.log("Payments count:", paymentsResult.data ? paymentsResult.data.length : 0, "Error:", paymentsResult.error);
    console.log("Invoices count:", invoicesResult.data ? invoicesResult.data.length : 0, "Error:", invoicesResult.error);
    console.log("Notifications count:", notificationsResult.data ? notificationsResult.data.length : 0, "Error:", notificationsResult.error);
    console.log("Recovery count:", recoveryResult.data ? recoveryResult.data.length : 0, "Error:", recoveryResult.error);
  } catch (e) {
    console.error("Promise.all rejected with:", e);
  }
}

run();
