import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { calculateDeliveryCharge } from '@/lib/services/delivery-service';
import { validateCustomerId, isTestModeRequest } from '@/lib/services/whatsapp-validation';

// Weight parsing helper
function parseWeightInKg(weightStr: string): number {
  if (!weightStr) return 0.5;
  const cleanStr = weightStr.toLowerCase().replace(/\s+/g, '');
  if (cleanStr.includes('kg')) {
    return parseFloat(cleanStr) || 0.5;
  }
  if (cleanStr.includes('g') || cleanStr.includes('gm')) {
    return (parseFloat(cleanStr) || 500) / 1000;
  }
  return 0.5;
}

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
    console.log("========== WhatsApp API ==========");
    console.log("Endpoint: /delivery-charge");
    console.log("Incoming Body:");
    console.log(JSON.stringify(body, null, 2));

    // Test Mode Detection
    if (isTestModeRequest(body)) {
      console.log("[AiSensy Test Mode] delivery-charge endpoint");
      const mockRes = {
        success: true,
        subtotal: 500,
        deliveryCharge: 40,
        total: 540,
        cartSummary: [
          {
            productName: "Sweet Chevdo (250g)",
            quantity: 2,
            price: 100,
            total: 200
          },
          {
            productName: "Mari Jada Gathiya (250g)",
            quantity: 1,
            price: 150,
            total: 150
          }
        ],
        testMode: true
      };
      console.log("[DeliveryChargeAPI] Returned response (Test Mode):", JSON.stringify(mockRes, null, 2));
      console.log("==================================");
      return NextResponse.json(mockRes, { status: 200 });
    }

    const { customerId } = body;
    console.log("[DeliveryChargeAPI] Resolved customerId:", customerId);

    const checkCustId = validateCustomerId(customerId);
    if (checkCustId) {
      console.log(`Validation: Failed customerId validation`);
      console.log("==================================");
      return checkCustId;
    }

    // 1. Find customer using customerId
    const { data: customer, error: customerErr } = await supabase
      .from('customers')
      .select('id, phone, full_name')
      .eq('id', customerId)
      .maybeSingle();

    if (customerErr) {
      console.error('[DeliveryChargeAPI] Customer lookup database error:', customerErr);
      const errRes = {
        success: false,
        step: "customer_lookup",
        message: "Database error retrieving customer details.",
        details: { supabaseError: customerErr }
      };
      console.log("[DeliveryChargeAPI] Returned response:", JSON.stringify(errRes, null, 2));
      return NextResponse.json(errRes, { status: 200 });
    }

    if (!customer) {
      const errRes = {
        success: false,
        step: "customer_lookup",
        message: "Customer not found."
      };
      console.log("[DeliveryChargeAPI] Returned response:", JSON.stringify(errRes, null, 2));
      return NextResponse.json(errRes, { status: 200 });
    }

    const cleanPhone = customer.phone;

    // 2. Fetch customer's default delivery address
    let { data: addressData, error: addressError } = await supabase
      .from('addresses')
      .select('id, customer_id, pincode, city, address, is_default')
      .eq('customer_id', customer.id)
      .eq('is_default', true)
      .maybeSingle();

    if (addressError) {
      console.error('[DeliveryChargeAPI] Address lookup error:', addressError);
    }

    // Fallback: If no default address is found, use the first available one
    if (!addressData) {
      const { data: anyAddress } = await supabase
        .from('addresses')
        .select('id, customer_id, pincode, city, address, is_default')
        .eq('customer_id', customer.id)
        .limit(1)
        .maybeSingle();
      addressData = anyAddress;
    }

    // 3. If no address exists, return success: false, message: Address not found
    if (!addressData || !addressData.pincode) {
      const errRes = {
        success: false,
        step: "address_lookup",
        message: "Address not found."
      };
      console.log("[DeliveryChargeAPI] Returned response:", JSON.stringify(errRes, null, 2));
      return NextResponse.json(errRes, { status: 200 });
    }

    // 4. Fetch customer's latest active cart
    const rawDigits = String(cleanPhone || customer.phone || '').replace(/\D/g, '').slice(-10);
    const phoneVariants = [rawDigits, `91${rawDigits}`, `+91${rawDigits}`];

    let { data: cart, error: cartErr } = await supabase
      .from('whatsapp_carts')
      .select('id, whatsapp_cart_items(*)')
      .in('phone', phoneVariants)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!cart || !cart.whatsapp_cart_items || cart.whatsapp_cart_items.length === 0) {
      const { data: latestCart } = await supabase
        .from('whatsapp_carts')
        .select('id, whatsapp_cart_items(*)')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latestCart) {
        cart = latestCart;
      }
    }

    if (cartErr) {
      console.error('[DeliveryChargeAPI] Cart lookup database error:', cartErr);
    }

    const cartItems = cart?.whatsapp_cart_items || [];
    if (cartItems.length === 0) {
      const errRes = {
        success: false,
        step: "cart_lookup",
        message: "Cart is empty."
      };
      console.log("[DeliveryChargeAPI] Returned response:", JSON.stringify(errRes, null, 2));
      return NextResponse.json(errRes, { status: 200 });
    }

    // Calculate Cart Value (subtotal)
    const cartValue = cartItems.reduce((sum: number, item: any) => sum + Number(item.subtotal || 0), 0);

    // Calculate Total Weight & Fetch DB product info for cartSummary
    let totalWeight = 0;
    const productIds = cartItems.map((item: any) => item.product_id);
    const { data: dbProducts } = await supabase
      .from('products')
      .select('id, name, weights')
      .in('id', productIds);

    const cartSummary = cartItems.map((item: any) => {
      const product = dbProducts?.find((p: any) => p.id === item.product_id);
      const weightStr = product?.weights?.[0] || 'Standard';
      const weightInKg = parseWeightInKg(weightStr);
      totalWeight += weightInKg * (item.quantity || 1);

      const unitPrice = Number(item.price || item.unit_price || 0);
      const qty = Number(item.quantity || 1);
      const lineTotal = Number(item.subtotal || item.line_total || (unitPrice * qty));

      let productName = product?.name || item.product_name || 'Item';
      if (item.variant && !productName.includes(item.variant)) {
        productName = `${productName} (${item.variant})`;
      }

      return {
        productName,
        quantity: qty,
        price: unitPrice,
        total: lineTotal
      };
    });

    // 5. Use the shared delivery calculation service
    const deliveryResult = await calculateDeliveryCharge(addressData.pincode, cartValue, totalWeight);

    if (!deliveryResult.success) {
      const errRes = {
        success: false,
        step: "delivery_serviceability",
        message: deliveryResult.error || 'Delivery not available for this pincode.',
        details: { pincode: addressData.pincode }
      };
      console.log("[DeliveryChargeAPI] Returned response:", JSON.stringify(errRes, null, 2));
      return NextResponse.json(errRes, { status: 200 });
    }

    const responseTime = Date.now() - startTime;
    const subtotal = Math.round(cartValue * 100) / 100;
    const deliveryCharge = Math.round(deliveryResult.deliveryCharge * 100) / 100;
    const total = Math.round((subtotal + deliveryCharge) * 100) / 100;

    // LOG: Endpoint statistics
    console.log('--- WhatsApp Delivery Charge API Logs ---');
    console.log(`Customer ID: ${customer.id}`);
    console.log(`Cart ID: ${cart?.id || 'N/A'}`);
    console.log(`Subtotal: ${subtotal}`);
    console.log(`Delivery Charge: ${deliveryCharge}`);
    console.log(`Total: ${total}`);
    console.log(`Response Time: ${responseTime}ms`);
    console.log('-----------------------------------------');

    const successRes = {
      success: true,
      subtotal,
      deliveryCharge,
      total,
      cartSummary,
      estimatedDelivery: deliveryResult.estimatedDeliveryTime || 'Today'
    };

    console.log("[DeliveryChargeAPI] Returned response:", JSON.stringify(successRes, null, 2));
    return NextResponse.json(successRes, { status: 200 });

  } catch (error: any) {
    console.error('[DeliveryChargeAPI] Uncaught API error:', error);
    const errRes = {
      success: false,
      step: "uncaught_server_error",
      message: "An unexpected error occurred on the server.",
      details: { error: String(error) }
    };
    return NextResponse.json(errRes, { status: 500 });
  }
}
