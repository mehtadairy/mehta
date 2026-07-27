const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log('=== Finding latest pending WhatsApp order ===');
  const { data: orders, error } = await supabaseServer
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching orders:', error);
    return;
  }

  console.log(`Found ${orders?.length} recent orders:`);
  for (const o of orders) {
    console.log(`Order: ${o.id} | ${o.order_number} | Status: ${o.status} | PaymentStatus: ${o.payment_status} | Phone: ${o.user_phone}`);
  }

  const target = orders.find(o => o.order_number === 'WA-156629' || o.id.startsWith('8cee838') || o.payment_status === 'Pending');

  if (target) {
    console.log(`\nUpdating target order ${target.order_number} (${target.id}) to Paid & Processing...`);
    const { error: updateErr } = await supabaseServer
      .from('orders')
      .update({
        payment_status: 'Paid',
        status: 'Processing',
        paid_at: new Date().toISOString(),
        payment_completed_at: new Date().toISOString()
      })
      .eq('id', target.id);

    if (updateErr) {
      console.error('Failed to update order:', updateErr);
    } else {
      console.log('✅ Successfully updated order status to Paid!');
    }
  }
}

run();
