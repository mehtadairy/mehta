import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testColumns() {
  const columns = 'id, order_number, created_at, status, total, subtotal, delivery_charge, discount, payment_status, payment_method, payment_id, payment_completed_at, invoice_url, user_name, user_phone, user_email, shipping_address, source, cancellation_reason, cancelled_by, cancelled_at, printed, print_status, order_items(product_id, product_name, weight, quantity, price, image), invoices(id, invoice_number, pdf_url, created_at)';
  
  const { data, error } = await supabase
    .from('orders')
    .select(columns)
    .limit(1);
    
  if (error) {
    console.error('Error fetching orders:', error.message);
  } else {
    console.log('Success! Columns exist.');
  }
}

testColumns();
