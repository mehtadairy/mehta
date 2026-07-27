import { NextResponse } from 'next/server';
import { getCart } from '@/lib/services/whatsapp-cart-service';
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
    console.log("[CartGetAPI] === INCOMING REQUEST BODY ===");
    console.log(JSON.stringify(body, null, 2));

    const { customerId } = body;
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
      .select('*')
      .eq('id', customerId)
      .maybeSingle();

    if (customerErr) {
      console.error('[CartGetAPI] Customer lookup database error:', customerErr);
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
    const result = await getCart(cleanPhone);
    const responseTime = Date.now() - startTime;

    console.log('--- WhatsApp Cart Get API Logs ---');
    console.log(`Phone: ${cleanPhone}`);
    console.log(`Response Time: ${responseTime}ms`);
    console.log('----------------------------------');

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API WhatsApp Cart Get Error:', error);
    return NextResponse.json({
      success: false,
      step: "uncaught_server_error",
      message: error.message || 'Internal Server Error'
    }, { status: 200 });
  }
}
