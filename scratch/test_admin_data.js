const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const { createClient } = require('@supabase/supabase-js');
const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Constants from route.ts
const ORDER_FIELDS = 'id, order_number, user_name, user_phone, user_email, total, status, payment_status, shipment_status, created_at, shipping_address, items_snapshot';
const ORDER_ITEMS_FIELDS = 'id, product_id, product_name, quantity, price, weight';
const INVOICE_FIELDS = 'id, invoice_number, order_id, pdf_url, created_at';
const CUSTOMER_FIELDS = 'id, name, phone, email, created_at, profile_image';
const PAYMENT_FIELDS = 'id, razorpay_order_id, order_id, amount, status, created_at';
const NOTIFICATION_FIELDS = 'id, type, event_type, customer_email, customer_phone, order_id, status, error_message, created_at';
const RECOVERY_FIELDS = 'id, payment_id, amount, status, failure_reason, created_at, order_data';

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
        .select(PAYMENT_FIELDS, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(0, 49),

      supabaseServer
        .from('invoices')
        .select(INVOICE_FIELDS, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(0, 49),

      supabaseServer
        .from('notifications')
        .select(NOTIFICATION_FIELDS)
        .order('created_at', { ascending: false })
        .limit(100),

      supabaseServer
        .from('payment_recovery')
        .select(RECOVERY_FIELDS)
        .order('created_at', { ascending: false })
        .limit(200),
    ]);

    console.log("Orders error:", ordersResult.error);
    console.log("Customers error:", customersResult.error);
    console.log("Payments error:", paymentsResult.error);
    console.log("Invoices error:", invoicesResult.error);
    console.log("Notifications error:", notificationsResult.error);
    console.log("Recovery error:", recoveryResult.error);
  } catch (e) {
    console.error("Promise.all rejected with:", e);
  }
}

run();
