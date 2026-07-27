import { createInvoice } from './src/lib/services/invoices';
import { supabase } from './src/lib/supabaseClient';

async function run() {
  const { data } = await supabase.from('orders').select('id').order('created_at', { ascending: false }).limit(1);
  if (data && data.length > 0) {
    const orderId = data[0].id;
    console.log("Generating for order:", orderId);
    const invoice = await createInvoice(orderId);
    console.log("Generated Invoice PDF URL:", invoice?.pdf_url);
  } else {
    console.log("No orders found");
  }
}

run();
