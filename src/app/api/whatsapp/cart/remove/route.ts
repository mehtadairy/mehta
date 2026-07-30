import { NextResponse } from 'next/server';
import { removeFromCart } from '@/lib/services/whatsapp-cart-service';
import { supabaseServer as supabase } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  const startTime = Date.now();
  let body: any = {};

  try {
    try {
      body = await req.json();
    } catch (err) {
      body = {};
    }

    // LOG: Incoming request body
    console.log("[CartRemoveAPI] === INCOMING REQUEST BODY ===");
    console.log(JSON.stringify(body, null, 2));

    const { customerId, productId, product_id } = body;
    const resolvedProductId = productId || product_id;

    if (!customerId) {
      return NextResponse.json({
        success: false,
        step: "customer_validation",
        message: "customerId parameter is required in the request body."
      }, { status: 200 });
    }

    // Lookup customer to get phone
    const { data: customer, error: customerErr } = await supabase
      .from('customers')
      .select('id, phone, name')
      .eq('id', customerId)
      .maybeSingle();

    if (customerErr) {
      console.error('[CartRemoveAPI] Customer lookup database error:', customerErr);
      return NextResponse.json({
        success: false,
        step: "customer_lookup",
        message: "Database error retrieving customer details.",
        details: { supabaseError: customerErr }
      }, { status: 200 });
    }

    if (!customer) {
      return NextResponse.json({
        success: false,
        step: "customer_lookup",
        message: "Customer not found."
      }, { status: 200 });
    }

    const cleanPhone = customer.phone;

    if (!resolvedProductId) {
      return NextResponse.json({
        success: false,
        step: "validation",
        message: "Missing required parameter: productId."
      }, { status: 200 });
    }

    const result = await removeFromCart(cleanPhone, resolvedProductId);
    const responseTime = Date.now() - startTime;

    console.log('--- WhatsApp Cart Remove API Logs ---');
    console.log(`Phone: ${cleanPhone}`);
    console.log(`Product ID: ${resolvedProductId}`);
    console.log(`Response Time: ${responseTime}ms`);
    console.log('-------------------------------------');

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API WhatsApp Cart Remove Error:', error);
    return NextResponse.json({
      success: false,
      step: "uncaught_server_error",
      message: error.message || 'Internal Server Error'
    }, { status: 200 });
  }
}
