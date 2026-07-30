import { supabaseServer as supabase } from '@/lib/supabaseServer';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export interface WhatsAppOrderItem {
  productIdOrName: string;
  quantity: number;
}

export interface WhatsAppOrderInput {
  customerName: string;
  customerMobile: string;
  customerAddress: string;
  customerPincode: string;
  items: WhatsAppOrderItem[];
}

export async function createWhatsAppOrder(payload: WhatsAppOrderInput) {
  const { customerName, customerMobile, customerAddress, customerPincode, items } = payload;

  // 1. Resolve Customer ID
  let customerId = null;
  const cleanPhone = customerMobile.replace(/\D/g, '').slice(-10);
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('id')
    .eq('phone', cleanPhone)
    .maybeSingle();
  
  if (existingCustomer) {
    customerId = existingCustomer.id;
  }

  // 2. Fetch products and calculate subtotal
  let subtotal = 0;
  const verifiedItems = [];

  for (const item of items) {
    // Try finding by UUID first, then fall back to case-insensitive name match
    let productData = null;
    const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(item.productIdOrName);
    
    if (isUUID) {
      const { data } = await supabase
        .from('products')
        .select('id, name, prices, selling_price, images, weights, stock')
        .eq('id', item.productIdOrName)
        .maybeSingle();
      productData = data;
    }

    if (!productData) {
      const { data } = await supabase
        .from('products')
        .select('id, name, prices, selling_price, images, weights, stock')
        .ilike('name', item.productIdOrName)
        .maybeSingle();
      productData = data;
    }

    if (!productData) {
      throw new Error(`Product not found: ${item.productIdOrName}`);
    }

    const parsedQuantity = parseInt(item.quantity.toString(), 10) || 1;
    const sellingPrice = productData.selling_price !== undefined 
      ? Number(productData.selling_price) 
      : (productData.prices ? Number(Object.values(productData.prices)[0]) : 0);
      
    subtotal += sellingPrice * parsedQuantity;

    verifiedItems.push({
      product_id: productData.id,
      product_name: productData.name,
      image: productData.images && productData.images.length > 0 ? productData.images[0] : null,
      weight: productData.weights && productData.weights.length > 0 ? productData.weights[0] : 'Standard',
      price: sellingPrice,
      quantity: parsedQuantity
    });
  }

  // Calculate delivery charge using delivery_zones table
  let deliveryCharge = 0;
  try {
    const userPincode = (customerPincode || '').trim();
    if (!userPincode) {
      throw new Error("Delivery not available.");
    }

    const { data: zones, error: zonesError } = await supabase
      .from('delivery_zones')
      .select('id, name, city, pincodes, pincode, delivery_charge, free_above');

    if (zonesError || !zones || zones.length === 0) {
      throw new Error("Delivery not available.");
    }

    const matchedZone = zones.find((zone: any) => {
      const pincodesStr = zone.pincodes || zone.pincode || "";
      const pincodesArr = pincodesStr.split(",").map((p: string) => p.trim());
      return pincodesArr.includes(userPincode);
    });

    if (!matchedZone) {
      throw new Error("Delivery not available.");
    }

    if (matchedZone.free_delivery_above && subtotal >= Number(matchedZone.free_delivery_above)) {
      deliveryCharge = 0;
    } else {
      deliveryCharge = Number(matchedZone.delivery_charge) || 0;
    }
  } catch (err: any) {
    console.error("Error calculating delivery charge in createWhatsAppOrder:", err);
    throw new Error(err.message || "Delivery not available.");
  }

  const grandTotal = subtotal + deliveryCharge;

  // Generate unique order identifier and receipt number
  const orderId = crypto.randomUUID();
  const orderNumber = `WA-${Math.floor(100000 + Math.random() * 900000)}`;

  // 3. Create a Razorpay Order using Orders API
  const rzpOrder = await razorpay.orders.create({
    amount: Math.round(grandTotal * 100), // amount in paise
    currency: "INR",
    receipt: orderNumber
  });

  // 4. Construct exact orderPayload matching the orders table schema
  const orderPayload = {
    id: orderId,
    order_number: orderNumber,
    customer_id: customerId,
    user_name: customerName,
    user_phone: customerMobile,
    user_email: '',
    subtotal: subtotal,
    discount: 0,
    coupon_code: null,
    delivery_charge: deliveryCharge,
    total: grandTotal,
    shipping_address: {
      name: customerName,
      phone: customerMobile,
      street: customerAddress,
      pincode: customerPincode,
      city: "Auto-detected",
      state: "Gujarat"
    },
    payment_method: 'Razorpay',
    payment_status: 'Pending',
    status: 'Pending',
    payment_id: rzpOrder.id // Store Razorpay order ID in payment_id column
  };

  console.log("INSERTING ORDER DATA TO SUPABASE (SHARED SERVICE):", orderPayload);

  let { data: orderInsertData, error: orderInsertError } = await supabase
    .from("orders")
    .insert(orderPayload)
    .select()
    .single();

  // Self-healing retry specifically for customer_id column if it doesn't exist in DB
  if (orderInsertError && (orderInsertError.message?.includes("customer_id") || orderInsertError.details?.includes("customer_id"))) {
    console.warn("Retrying order insertion without 'customer_id' column...");
    const { customer_id, ...cleanOrderData } = orderPayload;
    const retryResult = await supabase
      .from('orders')
      .insert(cleanOrderData)
      .select()
      .single();
    orderInsertData = retryResult.data;
    orderInsertError = retryResult.error;
  }

  console.log("SUPABASE ORDER INSERT RESPONSE (SHARED SERVICE):", { data: orderInsertData, error: orderInsertError });

  if (orderInsertError) {
    throw orderInsertError;
  }

  // 5. Construct order items payload
  const orderItemsPayload = verifiedItems.map(item => ({
    order_id: orderId,
    ...item
  }));

  console.log("INSERTING ORDER ITEMS TO SUPABASE (SHARED SERVICE):", orderItemsPayload);
  const itemResult = await supabase.from('order_items').insert(orderItemsPayload);
  console.log("SUPABASE ITEM INSERT RESPONSE (SHARED SERVICE):", itemResult);

  return {
    orderId,
    orderNumber,
    rzpOrderId: rzpOrder.id,
    amount: grandTotal,
    currency: "INR",
    items: verifiedItems
  };
}
