import { NextResponse } from 'next/server';
import { addToCart } from '@/lib/services/whatsapp-cart-service';
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
    console.log("[CartAddAPI] === INCOMING REQUEST BODY ===");
    console.log(JSON.stringify(body, null, 2));

    const { customerId, quantity, productId } = body;
    const productNameRaw = body.productName || body.product || body.slug || body.sku || '';

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
      console.error('[CartAddAPI] Customer lookup database error:', customerErr);
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

    if (!productNameRaw || productNameRaw.trim() === '' || quantity === undefined) {
      return NextResponse.json({
        success: false,
        step: "validation",
        message: "Missing required fields: quantity and productName."
      }, { status: 200 });
    }

    const numericQty = parseInt(quantity.toString(), 10);
    if (isNaN(numericQty) || numericQty <= 0) {
      return NextResponse.json({
        success: false,
        step: "validation",
        message: "Invalid quantity."
      }, { status: 200 });
    }

    const normalizedName = productNameRaw.trim();

    // Fetch product details
    let query = supabase.from('products').select('id, name, prices, images');
    if (productId) {
      query = query.eq('id', productId);
    } else {
      query = query.ilike('name', normalizedName);
    }

    const { data: product, error: productError } = await query.limit(1).maybeSingle();

    if (productError || !product) {
      return NextResponse.json({
        success: false,
        step: "product_lookup",
        message: "Product not found in catalogue."
      }, { status: 200 });
    }

    const price = product.prices?.["1kg"] ?? Object.values(product.prices ?? {})[0] ?? 0;
    const image = Array.isArray(product.images) ? product.images[0] : "";

    const result = await addToCart({
      phone: cleanPhone,
      productId: product.id,
      productName: product.name,
      image,
      price: Number(price),
      quantity: numericQty
    });

    const responseTime = Date.now() - startTime;
    console.log('--- WhatsApp Cart Add API Logs ---');
    console.log(`Phone: ${cleanPhone}`);
    console.log(`Product: ${product.name}`);
    console.log(`Response Time: ${responseTime}ms`);
    console.log('----------------------------------');

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API WhatsApp Cart Add Error:', error);
    return NextResponse.json({
      success: false,
      step: "uncaught_server_error",
      message: error.message || 'Internal Server Error'
    }, { status: 200 });
  }
}
