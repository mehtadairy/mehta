import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { calculateDeliveryCharge } from '@/lib/services/delivery-service';
import { validateCustomerId, isTestModeRequest, isValidUUID } from '@/lib/services/whatsapp-validation';
import crypto from 'crypto';

interface ExtractedItem {
  productName?: string;
  productId?: string;
  retailerId?: string;
  quantity: number;
  price?: number;
}

// Helper for weight parsing
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

// Robust, generic parser to extract catalog cart items from AiSensy / Meta payloads
function parseCatalogItems(cartData: any, rawData: any): ExtractedItem[] {
  const items: ExtractedItem[] = [];

  const processItemsArray = (arr: any[]) => {
    for (const item of arr) {
      if (!item || typeof item !== 'object') continue;

      let quantity = 1;
      if (item.quantity !== undefined) {
        quantity = parseInt(item.quantity, 10) || 1;
      } else if (item.qty !== undefined) {
        quantity = parseInt(item.qty, 10) || 1;
      }

      const productId = item.product_id || item.productId || item.id || undefined;
      const retailerId = item.product_retailer_id || item.retailer_id || item.retailerId || item.sku || undefined;
      const productName = item.product_name || item.productName || item.name || item.title || undefined;
      
      let price = undefined;
      if (item.price !== undefined) {
        price = parseFloat(item.price);
      } else if (item.item_price !== undefined) {
        price = parseFloat(item.item_price);
      } else if (item.amount !== undefined) {
        price = parseFloat(item.amount);
      }

      items.push({
        productName,
        productId,
        retailerId,
        quantity,
        price
      });
    }
  };

  const findAndProcessArrays = (obj: any) => {
    if (!obj || typeof obj !== 'object') return;
    
    if (Array.isArray(obj)) {
      processItemsArray(obj);
      return;
    }

    if (Array.isArray(obj.product_items)) {
      processItemsArray(obj.product_items);
      return;
    }
    if (Array.isArray(obj.items)) {
      processItemsArray(obj.items);
      return;
    }
    if (Array.isArray(obj.products)) {
      processItemsArray(obj.products);
      return;
    }

    for (const key of Object.keys(obj)) {
      if (Array.isArray(obj[key])) {
        processItemsArray(obj[key]);
        return;
      } else if (obj[key] && typeof obj[key] === 'object') {
        for (const subKey of Object.keys(obj[key])) {
          if (Array.isArray(obj[key][subKey])) {
            processItemsArray(obj[key][subKey]);
            return;
          }
        }
      }
    }
  };

  findAndProcessArrays(cartData);
  if (items.length === 0) {
    findAndProcessArrays(rawData);
  }

  return items;
}

export async function POST(req: Request) {
  const startTime = Date.now();
  let rawBody = "";
  try {
    rawBody = await req.text();
  } catch (err) {
    console.error("[CreateOrder] Error reading raw body text:", err);
  }

  console.log("================================");
  console.log("CREATE ORDER API v2");
  console.log(`URL: ${req.url}`);
  console.log(`Method: ${req.method}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log("Raw Request Body:", rawBody);
  console.log("================================");

  if (!rawBody || rawBody.trim() === "") {
    return NextResponse.json({
      success: false,
      error: "Empty request body"
    }, { status: 400 });
  }

  let body: any = {};
  try {
    body = JSON.parse(rawBody);
  } catch (err) {
    console.error("[CreateOrder] First JSON parse failed:", err);
    return NextResponse.json({
      success: false,
      error: "Invalid JSON payload"
    }, { status: 400 });
  }

  console.log("First Parse Details:");
  console.log("typeof body:", typeof body);
  console.log("Parsed body:", JSON.stringify(body, null, 2));
  console.log("Body keys:", body && typeof body === 'object' ? Object.keys(body) : "none");
  console.log("================================");

  if (typeof body === "string") {
    console.log("Received string payload, decoding...");
    try {
      body = JSON.parse(body);
    } catch (err) {
      console.error("[CreateOrder] String payload JSON decode failed:", err);
    }
  }

  console.log("Final typeof:", typeof body);
  console.log("Final body keys:", body && typeof body === 'object' ? Object.keys(body) : []);
  console.log("================================");

  try {
    // Test Mode Detection
    if (isTestModeRequest(body)) {
      console.log("[AiSensy Test Mode] create-order endpoint");
      const mockRes = {
        success: true,
        paymentRequired: true,
        orderId: "00000000-0000-4000-8000-000000000001",
        message: "Order created successfully.",
        testMode: true
      };
      console.log("[CreateOrder] Returned response (Test Mode):", JSON.stringify(mockRes, null, 2));
      console.log("==================================");
      return NextResponse.json(mockRes, { status: 200 });
    }

    const { cartData, rawData } = body;
    const paymentMethod = body.paymentMethod || 'WHATSAPP_PAY';

    const targetCustomerId = body.customerId || body.customerid || body.id;
    const targetPhone = body.phone || body.customermobile || body.user_phone || body.mobile;
    const targetName = body.customerName || body.customername || body.name || 'WhatsApp Customer';
    const targetAddress = body.address || body.customeraddress || body.street || 'Address provided on WhatsApp';
    const targetPincode = body.pincode || body.customerpincode || '364270';

    let customer: any = null;

    // 1. Try customer lookup by UUID
    if (targetCustomerId && typeof targetCustomerId === 'string' && isValidUUID(targetCustomerId)) {
      const { data } = await supabase.from('customers').select('id, name, phone, email, role').eq('id', targetCustomerId).maybeSingle();
      customer = data;
    }

    // 2. Try customer lookup/upsert by phone number
    if (!customer && targetPhone) {
      const cleanDigits = String(targetPhone).replace(/\D/g, '').slice(-10);
      if (cleanDigits.length === 10) {
        const fullPhone = `91${cleanDigits}`;
        const { data } = await supabase.from('customers').select('id, name, phone, email, role').eq('phone', fullPhone).maybeSingle();
        customer = data;

        if (!customer) {
          console.log(`[CreateOrder] Auto-creating customer record for phone ${fullPhone}`);
          const { data: newCust } = await supabase.from('customers').insert([{
            phone: fullPhone,
            name: targetName,
            role: 'customer'
          }]).select().single();
          customer = newCust;
        }
      }
    }

    // 3. Fallback: Lookup latest customer in DB
    if (!customer) {
      const { data: latestCust } = await supabase.from('customers').select('id, name, phone, email, role').order('created_at', { ascending: false }).limit(1).maybeSingle();
      customer = latestCust;
    }

    if (!customer) {
      console.warn("[CreateOrder] Validation failed: Customer record could not be identified.");
      return NextResponse.json({
        success: false,
        step: "customer_lookup",
        message: "Customer record not found."
      }, { status: 200 });
    }

    const cleanPhone = customer.phone;

    // Fetch or create default shipping address for customer
    let { data: addressData } = await supabase
      .from('addresses')
      .select('id, customer_id, full_name, address, pincode, mobile, state, city, is_default')
      .eq('customer_id', customer.id)
      .eq('is_default', true)
      .maybeSingle();

    let resolvedAddress = addressData;
    if (!resolvedAddress) {
      const { data: anyAddress } = await supabase
        .from('addresses')
        .select('id, customer_id, full_name, address, pincode, mobile, state, city, is_default')
        .eq('customer_id', customer.id)
        .limit(1)
        .maybeSingle();
      resolvedAddress = anyAddress;
    }

    if (!resolvedAddress) {
      console.log(`[CreateOrder] Auto-creating address record for customer ${customer.id}`);
      const { data: newAddr } = await supabase.from('addresses').insert([{
        customer_id: customer.id,
        full_name: customer.name || targetName,
        address: targetAddress,
        pincode: targetPincode,
        mobile: cleanPhone,
        city: 'Auto-detected',
        state: 'Gujarat',
        is_default: true
      }]).select().single();
      resolvedAddress = newAddr;
    }

    if (!resolvedAddress || !resolvedAddress.pincode) {
      console.warn("[CreateOrder] Validation failed: Customer address or pincode is missing.");
      return NextResponse.json({
        success: false,
        step: "address_lookup",
        message: "Customer shipping address or pincode is missing.",
        details: { customerId: customer.id }
      }, { status: 200 });
    }

    const pincode = resolvedAddress.pincode.trim();

    // Fetch customer's active cart items
    let parsedItems = parseCatalogItems(cartData, rawData);
    let isFromDbCart = false;

    const rawDigits = String(cleanPhone || customer.phone || '').replace(/\D/g, '').slice(-10);
    const phoneVariants = [rawDigits, `91${rawDigits}`, `+91${rawDigits}`];

    let { data: dbCart, error: dbCartError } = await supabase
      .from('whatsapp_carts')
      .select('id, whatsapp_cart_items(*)')
      .in('phone', phoneVariants)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dbCartError) {
      console.error("[CreateOrder] SUPABASE ERROR during DB cart lookup:", dbCartError);
    }

    if (parsedItems.length === 0) {
      console.log("[CreateOrder] Request body cart is empty. Fetching cart from DB...");

      if (!dbCart || !dbCart.whatsapp_cart_items || dbCart.whatsapp_cart_items.length === 0) {
        console.log("[CreateOrder] Phone variants lookup returned no cart. Fetching latest active cart overall...");
        const { data: latestCart } = await supabase
          .from('whatsapp_carts')
          .select('id, whatsapp_cart_items(*)')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (latestCart) {
          dbCart = latestCart;
        }
      }

      const dbItems = dbCart?.whatsapp_cart_items || [];
      console.log(`[CreateOrder] Found DB cart. Items count: ${dbItems.length}`);
      if (dbItems.length > 0) {
        isFromDbCart = true;
        parsedItems = dbItems.map((item: any) => ({
          productId: item.product_id,
          productName: item.product_name,
          quantity: item.quantity,
          price: Number(item.price)
        }));
      }
    }

    if (parsedItems.length === 0) {
      console.warn("[CreateOrder] Validation failed: Active WhatsApp cart is empty.");
      return NextResponse.json({
        success: false,
        step: "cart_lookup",
        message: "Cart is empty."
      }, { status: 200 });
    }

    // Verify products exist — lean select (only columns needed for order creation)
    const { data: allProducts, error: allProductsError } = await supabase.from('products').select('id, name, prices, stock, weight_per_unit, images, retailer_id');
    if (allProductsError || !allProducts) {
      console.error("[CreateOrder] SUPABASE ERROR during products fetching:", allProductsError);
      return NextResponse.json({
        success: false,
        step: "product_validation",
        message: "Failed to fetch products catalogue from database.",
        details: { supabaseError: allProductsError }
      }, { status: 200 });
    }

    const matchedProducts: { dbProduct: any; quantity: number; price: number }[] = [];
    const missingProductDetails: string[] = [];

    for (const item of parsedItems) {
      const match = allProducts.find((p: any) => {
        const cleanStr = (str: string) => (str || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const pNameClean = cleanStr(p.name);
        const itemRetailerIdClean = cleanStr(item.retailerId || '');
        const itemProductNameClean = cleanStr(item.productName || '');

        if (item.productId && p.id === item.productId) return true;
        if (item.retailerId && p.id === item.retailerId) return true;
        if (item.retailerId && p.retailer_id && String(p.retailer_id).toLowerCase() === String(item.retailerId).toLowerCase()) return true;
        if (item.retailerId && p.sku && String(p.sku).toLowerCase() === String(item.retailerId).toLowerCase()) return true;
        if (item.retailerId && p.slug && String(p.slug).toLowerCase() === String(item.retailerId).toLowerCase()) return true;
        if (item.productName && p.slug && String(p.slug).toLowerCase() === String(item.productName).toLowerCase()) return true;
        if (item.retailerId && pNameClean === itemRetailerIdClean) return true;
        if (item.productName && pNameClean === itemProductNameClean) return true;

        return false;
      });

      if (!match) {
        missingProductDetails.push(item.productName || item.retailerId || 'Unknown item');
      } else {
        // Respect cart price if provided (e.g. ₹1 test price for Sweet Chevdo), without mutating DB product price
        let resolvedPrice = (item.price !== undefined && item.price !== null && Number(item.price) > 0)
          ? Number(item.price)
          : 0;

        if (!resolvedPrice) {
          if (match.selling_price !== undefined && match.selling_price !== null) {
            resolvedPrice = Number(match.selling_price);
          } else if (match.prices && typeof match.prices === 'object') {
            resolvedPrice = Number(Object.values(match.prices)[0]) || 0;
          } else if (match.price !== undefined && match.price !== null) {
            resolvedPrice = Number(match.price);
          }
        }

        matchedProducts.push({
          dbProduct: match,
          quantity: item.quantity,
          price: resolvedPrice
        });
      }
    }

    if (missingProductDetails.length > 0) {
      console.warn("[CreateOrder] Validation failed: Products not found in DB.", missingProductDetails);
      return NextResponse.json({
        success: false,
        step: "product_validation",
        message: `One or more products in your cart could not be matched in database.`,
        details: { missing_items: missingProductDetails }
      }, { status: 200 });
    }

    // Verify weights are valid
    const invalidWeightProducts = matchedProducts.filter(p => !p.dbProduct.weights || p.dbProduct.weights.length === 0);
    if (invalidWeightProducts.length > 0) {
      console.warn("[CreateOrder] Validation failed: Invalid product weights.", invalidWeightProducts.map(p => p.dbProduct.name));
      return NextResponse.json({
        success: false,
        step: "product_validation",
        message: "Invalid or missing product weight specifications in catalogue.",
        details: { products: invalidWeightProducts.map(p => p.dbProduct.name) }
      }, { status: 200 });
    }

    // Calculate subtotal
    const subtotal = matchedProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Verify subtotal > 0
    if (subtotal <= 0) {
      console.warn(`[CreateOrder] Validation failed: Subtotal is <= 0 (${subtotal}).`);
      return NextResponse.json({
        success: false,
        step: "cart_validation",
        message: "Cart subtotal must be greater than zero.",
        details: { subtotal }
      }, { status: 200 });
    }

    // Calculate total weight in kg
    let totalWeight = 0;
    for (const item of matchedProducts) {
      const weightStr = item.dbProduct?.weights?.[0] || 'Standard';
      const weightInKg = parseWeightInKg(weightStr);
      totalWeight += weightInKg * item.quantity;
    }

    // Use unified delivery calculation helper
    const deliveryResult = await calculateDeliveryCharge(pincode, subtotal, totalWeight);
    if (!deliveryResult.success) {
      console.warn("[CreateOrder] Validation failed: Delivery not serviceable.", deliveryResult.error);
      return NextResponse.json({
        success: false,
        step: "delivery_serviceability",
        message: deliveryResult.error || 'Delivery not available for this pincode.',
        details: { pincode }
      }, { status: 200 });
    }

    const deliveryCharge = deliveryResult.deliveryCharge;
    const grandTotal = subtotal + deliveryCharge;

    const orderId = crypto.randomUUID();
    const orderNumber = `WA-${Math.floor(100000 + Math.random() * 900000)}`;

    console.log("==================================================");
    console.log("[CreateOrder] AUDIT LOG - Step 1: Customer ID Received:", customer.id);
    console.log("[CreateOrder] AUDIT LOG - Step 2: Active Cart ID:", dbCart?.id || 'N/A', "Items count:", parsedItems.length);
    console.log("[CreateOrder] AUDIT LOG - Step 3: Matched Products:", matchedProducts.map(m => `${m.dbProduct.name} x ${m.quantity} @ ₹${m.price}`).join(', '));
    console.log("[CreateOrder] AUDIT LOG - Step 4: Pricing -> Subtotal:", subtotal, "Delivery Charge:", deliveryCharge, "Grand Total:", grandTotal);

    // Detect 'source' column in orders
    let hasSourceColumn = false;
    try {
      const { error: testErr } = await supabase.from('orders').select('source').limit(1);
      hasSourceColumn = !testErr;
    } catch (err) {
      hasSourceColumn = false;
    }

    const orderPayload: any = {
      id: orderId,
      order_number: orderNumber,
      customer_id: customer.id,
      user_name: customer.name || 'WhatsApp Customer',
      user_phone: cleanPhone,
      user_email: customer.email || '',
      payment_method: paymentMethod,
      subtotal: subtotal,
      delivery_charge: deliveryCharge,
      discount: 0,
      total: grandTotal,
      status: 'Pending',
      payment_status: 'Pending',
      source: 'WHATSAPP',
      shipping_address: {
        id: resolvedAddress.id,
        name: customer.name || 'WhatsApp Customer',
        phone: cleanPhone,
        street: resolvedAddress.address,
        pincode: resolvedAddress.pincode,
        city: resolvedAddress.city || 'Auto-detected',
        state: resolvedAddress.state || 'Gujarat',
        source: 'WHATSAPP'
      }
    };

    if (hasSourceColumn) {
      orderPayload.source = 'WHATSAPP';
    }

    console.log("[CreateOrder] AUDIT LOG - Step 5: Exact Order Payload to insert:");
    console.log(JSON.stringify(orderPayload, null, 2));

    let orderInsertResult = await supabase.from('orders').insert([orderPayload]).select().single();

    console.log("[CreateOrder] AUDIT LOG - Step 6: Supabase Insert Response Status:");
    console.log("Error:", JSON.stringify(orderInsertResult.error, null, 2));

    if (orderInsertResult.error) {
      console.error("[CreateOrder] AUDIT LOG - Step 9: SUPABASE ERROR initial insert failed:", orderInsertResult.error);
      
      const sanitizedPayload = {
        id: orderId,
        order_number: orderNumber,
        customer_id: customer.id,
        user_name: customer.name || 'WhatsApp Customer',
        user_phone: cleanPhone,
        user_email: customer.email || '',
        subtotal: subtotal,
        delivery_charge: deliveryCharge,
        total: grandTotal,
        shipping_address: {
          id: resolvedAddress.id,
          name: customer.name || 'WhatsApp Customer',
          phone: cleanPhone,
          street: resolvedAddress.address,
          pincode: resolvedAddress.pincode,
          city: resolvedAddress.city || 'Auto-detected',
          state: resolvedAddress.state || 'Gujarat'
        },
        payment_method: paymentMethod,
        payment_status: 'Pending',
        status: 'Pending'
      };

      console.log("[CreateOrder] Retrying order insertion with basic schema...");
      orderInsertResult = await supabase.from('orders').insert([sanitizedPayload]).select().single();

      if (orderInsertResult.error) {
        console.error("[CreateOrder] AUDIT LOG - Step 9: SUPABASE ERROR final order insertion failed:", orderInsertResult.error);
        return NextResponse.json({
          success: false,
          step: "order_insert",
          message: "Failed to create order record in database.",
          details: { supabaseError: orderInsertResult.error }
        }, { status: 200 });
      }
    }

    console.log("[CreateOrder] AUDIT LOG - Step 7: Inserted Order ID:", orderId, "Order Number:", orderNumber);

    // Immediate Verification Step 8
    const { data: verifiedOrder, error: verifyErr } = await supabase.from('orders').select('id, order_number').eq('id', orderId).single();
    if (verifiedOrder) {
      console.log("[CreateOrder] AUDIT LOG - Step 8: VERIFIED - Inserted order exists in Supabase DB! ID:", verifiedOrder.id);
    } else {
      console.error("[CreateOrder] AUDIT LOG - Step 8: WARNING - Verification query failed:", verifyErr);
    }

    // Insert order items
    const orderItemsPayload = matchedProducts.map(item => ({
      order_id: orderId,
      product_id: item.dbProduct.id,
      product_name: item.dbProduct.name,
      quantity: item.quantity,
      price: item.price,
      image: item.dbProduct.images?.[0] || null,
      weight: item.dbProduct.weights?.[0] || 'Standard'
    }));

    let itemsInsertResult = await supabase.from('order_items').insert(orderItemsPayload);
    if (itemsInsertResult.error) {
      console.error("[CreateOrder] SUPABASE ERROR order items insertion failed, retrying minimal items...", itemsInsertResult.error);
      const minimalItems = matchedProducts.map(item => ({
        order_id: orderId,
        product_id: item.dbProduct.id,
        product_name: item.dbProduct.name,
        quantity: item.quantity,
        price: item.price
      }));
      await supabase.from('order_items').insert(minimalItems);
    }

    console.log("[CreateOrder] Successfully inserted order items.");
    console.log("==================================================");

    // Clear active WhatsApp cart in DB on successful checkout
    if (dbCart) {
      try {
        await supabase
          .from('whatsapp_carts')
          .delete()
          .eq('id', dbCart.id);
      } catch (clearErr) {
        console.error('[CreateOrder] Non-blocking warning: error clearing cart:', clearErr);
      }
    }

    const responsePayload = {
      success: true,
      paymentRequired: true,
      orderId: orderId,
      message: "Order created successfully."
    };

    const responseTime = Date.now() - startTime;

    // LOG: Endpoint statistics
    console.log('--- WhatsApp Create Order API Logs ---');
    console.log(`Customer ID: ${customer.id}`);
    console.log(`Order ID: ${orderId}`);
    console.log(`Cart ID: ${dbCart?.id || 'N/A'}`);
    console.log(`Subtotal: ${subtotal}`);
    console.log(`Delivery Charge: ${deliveryCharge}`);
    console.log(`Total: ${grandTotal}`);
    console.log(`Response Time: ${responseTime}ms`);
    console.log('--------------------------------------');

    console.log("[CreateOrder] Returned response:", JSON.stringify(responsePayload, null, 2));
    return NextResponse.json(responsePayload, { status: 200 });

  } catch (error: any) {
    console.error('[CreateOrder] Uncaught server error:', error);
    const errRes = {
      success: false,
      step: "uncaught_server_error",
      message: "An unexpected error occurred on the server.",
      details: { error: String(error) }
    };
    console.log("[CreateOrder] Returned response:", JSON.stringify(errRes, null, 2));
    return NextResponse.json(errRes, { status: 200 });
  }
}
