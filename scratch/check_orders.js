const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log('=== Checking ORD-000094 ===');
  const { data: o, error } = await supabaseServer
    .from('orders')
    .select('*')
    .eq('order_number', 'ORD-000094')
    .single();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Order ORD-000094:', {
      id: o.id,
      order_number: o.order_number,
      status: o.status,
      payment_status: o.payment_status,
      payment_method: o.payment_method
    });
  }
  return;

  try {
    const { data: orders, error: ordersError } = await supabaseServer
      .from('orders')
      .select('*, order_items(*), invoices(*)')
      .order('created_at', { ascending: false });

    if (ordersError) {
      appendLog('❌ Orders Query Error:', ordersError);
      return;
    }

    appendLog(`Fetched ${orders.length} orders. Testing mapping function for each order...`);

    let crashCount = 0;
    for (let idx = 0; idx < orders.length; idx++) {
      const o = orders[idx];
      try {
        const formatted = {
          id: o.id,
          orderNumber: o.order_number,
          date: new Date(o.created_at).toLocaleDateString(),
          createdAtRaw: o.created_at,
          status: o.status,
          total: o.total,
          paymentStatus: o.payment_status,
          paymentMethod: o.payment_method,
          paymentId: o.payment_id,
          paidAt: o.paid_at,
          paymentCompletedAt: o.payment_completed_at,
          invoiceUrl: o.invoice_url,
          userName: o.user_name,
          userPhone: o.user_phone,
          userEmail: o.user_email,
          shippingAddress: o.shipping_address,
          invoice: o.invoices && o.invoices.length > 0 ? o.invoices[0] : null,
          source: o.source || (o.shipping_address && typeof o.shipping_address === 'object' && o.shipping_address.source ? o.shipping_address.source : 'website'),
          items: o.order_items ? o.order_items.map((i) => {
            if (!i) {
              throw new Error('Order item is null or undefined!');
            }
            return {
              productId: i.product_id,
              productName: i.product_name,
              weight: i.weight,
              quantity: i.quantity,
              price: i.price,
              image: i.image
            };
          }) : []
        };
      } catch (err) {
        crashCount++;
        appendLog(`❌ Crash at Order Index ${idx} (Order Number: ${o.order_number}):`, {
          errorMessage: err.message,
          orderData: o
        });
      }
    }

    if (crashCount === 0) {
      appendLog('✅ All orders mapped successfully! No crashes found in mapping logic.');
    } else {
      appendLog(`⚠️ Found ${crashCount} crashing orders.`);
    }

  } catch (e) {
    appendLog('💥 General Crash:', e.message);
  }

  // Write log to a text file in workspace
  const outputPath = path.join(__dirname, 'mapping_output.txt');
  fs.writeFileSync(outputPath, log, 'utf-8');
  console.log(`Diagnostics written to: ${outputPath}`);
}

run();
