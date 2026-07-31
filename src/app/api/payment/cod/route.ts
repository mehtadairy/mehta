import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { createInvoice } from '@/lib/services/invoices';
import { WhatsAppService } from '@/lib/services/whatsapp';
import { verifyCustomerSession } from '@/lib/auth-utils';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { orderPayload, orderItems } = await request.json();

    if (!orderPayload || !orderItems || orderItems.length === 0) {
      return NextResponse.json({ success: false, error: 'Missing order details or items' }, { status: 400 });
    }

    // 🔒 1. Authenticate or Identify the User
    let customerId = null;
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('mehta_customer_token')?.value;
      if (token) {
        const payload = await verifyCustomerSession(token);
        if (payload?.id) customerId = payload.id;
      }
      if (!customerId) {
        const authHeader = request.headers.get('Authorization');
        if (authHeader) {
          const authToken = authHeader.replace('Bearer ', '');
          const { data } = await supabase.auth.getUser(authToken);
          if (data?.user) customerId = data.user.id;
        } else {
          const { data } = await supabase.auth.getUser();
          if (data?.user) customerId = data.user.id;
        }
      }
      
      if (customerId) {
         const { data: cust } = await supabase.from('customers').select('id').or(`id.eq.${customerId},auth_user_id.eq.${customerId}`).maybeSingle();
         if (cust) customerId = cust.id;
      }
    } catch (e) {
      console.warn("COD customer auth resolution warning:", e);
    }

    if (!customerId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication Required. Please log in or create an account to place an order.'
      }, { status: 401 });
    }

    // 🔒 2. Server-Side Cart Calculation
    // Fetch product prices from DB
    const productIds = orderItems.map((item: any) => item.product_id);
    const { data: dbProducts, error: prodError } = await supabase
      .from('products')
      .select('id, prices')
      .in('id', productIds);
      
    if (prodError || !dbProducts) {
      console.error("Supabase error fetching products/prices for COD:", prodError);
      return NextResponse.json({ success: false, error: 'Failed to verify product prices', details: prodError?.message }, { status: 500 });
    }

    let serverSubtotal = 0;
    const verifiedOrderItems = orderItems.map((item: any) => {
      const qty = Math.max(1, Number(item.quantity) || 1);
      const dbProduct = dbProducts.find((p: any) => p.id === item.product_id);
      // Look up price by variant weight
      const verifiedPrice = dbProduct?.prices?.[item.weight] ?? dbProduct?.prices?.[Object.keys(dbProduct?.prices || {})[0]] ?? 0;
      serverSubtotal += verifiedPrice * qty;
      return {
        ...item,
        quantity: qty,
        price: verifiedPrice // Enforce DB price
      };
    });

    const shippingAddress = orderPayload.shipping_address;
    let deliveryCharge = 0;

    if (shippingAddress && shippingAddress.id !== 'pickup') {
      const userPincode = (shippingAddress.pincode || '').trim();
      const { data: zones, error: zonesError } = await supabase
        .from('delivery_zones')
        .select('*');

      if (!zonesError && zones) {
        const matchedZone = zones.find((zone: any) => {
          const pincodesStr = zone.pincodes || zone.pincode || '';
          const pincodesArr = pincodesStr.split(',').map((p: string) => p.trim());
          return pincodesArr.includes(userPincode);
        });

        if (matchedZone) {
          if (matchedZone.free_delivery_above && serverSubtotal >= Number(matchedZone.free_delivery_above)) {
            deliveryCharge = 0;
          } else {
            deliveryCharge = Number(matchedZone.delivery_charge) || 0;
          }
        }
      }
    }

    const discountVal = Math.max(0, Number(orderPayload?.discount) || 0);
    const expectedTotal = Math.max(0, serverSubtotal + deliveryCharge - discountVal);

    const rawAddr = shippingAddress || orderPayload?.shipping_address || orderPayload?.shippingAddress;

    let generatedOrderNumber = orderPayload?.order_number;
    if (!generatedOrderNumber) {
      try {
        const { data: newOrd, error: rpcError } = await supabase.rpc('get_next_order_number');
        if (!rpcError && newOrd) {
          generatedOrderNumber = newOrd;
        }
      } catch (e) {
        console.warn("RPC get_next_order_number unavailable, using fallback order number");
      }

      if (!generatedOrderNumber) {
        const now = new Date();
        const dateStr = now.toISOString().slice(2,10).replace(/-/g, '');
        const randDigits = Math.floor(1000 + Math.random() * 9000);
        generatedOrderNumber = `MD-${dateStr}-${randDigits}`;
      }
    }

    const finalOrderData: any = {
      id: orderPayload.id,
      order_number: generatedOrderNumber,
      customer_id: customerId || orderPayload?.customer_id || null,
      user_name: orderPayload?.user_name || orderPayload?.userName || rawAddr?.name || 'Customer',
      user_phone: orderPayload?.user_phone || orderPayload?.userPhone || rawAddr?.phone || '',
      user_email: orderPayload?.user_email || orderPayload?.userEmail || '',
      subtotal: serverSubtotal,
      discount: Number(orderPayload?.discount) || 0,
      total: expectedTotal,
      delivery_charge: deliveryCharge,
      shipping_address: rawAddr || {},
      payment_id: 'COD-' + Date.now(),
      payment_method: 'COD',
      payment_status: 'Pending',
      status: 'Processing',
      source: 'website'
    };

    console.log("Inserting COD order to DB:", finalOrderData.order_number);
    let { data: newOrder, error: orderError } = await supabase.from('orders').upsert([finalOrderData], { onConflict: 'id' }).select().single();
    
    // Self-healing retry: If customer_id column error or foreign key violation occurs
    if (orderError) {
      console.warn("Retrying COD order insertion with minimal clean schema and customer_id set to null...", orderError.message);
      const cleanPayload: any = {
        id: finalOrderData.id,
        order_number: finalOrderData.order_number,
        user_name: finalOrderData.user_name,
        user_phone: finalOrderData.user_phone,
        user_email: finalOrderData.user_email,
        subtotal: finalOrderData.subtotal,
        discount: finalOrderData.discount,
        total: finalOrderData.total,
        delivery_charge: finalOrderData.delivery_charge,
        shipping_address: finalOrderData.shipping_address,
        payment_id: finalOrderData.payment_id,
        payment_method: finalOrderData.payment_method,
        payment_status: finalOrderData.payment_status,
        status: finalOrderData.status,
        source: 'website',
        customer_id: null // Set to null to bypass RLS/FK constraint failures
      };

      const { data: retryData, error: retryError } = await supabase.from('orders').upsert([cleanPayload], { onConflict: 'id' }).select().single();
      orderError = retryError;
      if (retryData) newOrder = retryData;
    }
    
    if (orderError || !newOrder) {
      console.error("Failed to insert COD order:", orderError);
      return NextResponse.json({ success: false, error: 'Failed to save order to database: ' + (orderError?.message || JSON.stringify(orderError)) }, { status: 500 });
    }

    // Insert Order Items explicitly mapped
    const finalOrderItems = verifiedOrderItems.map(item => ({
      order_id: newOrder.id,
      product_id: item.product_id || item.productId,
      product_name: item.product_name || item.productName,
      weight: item.weight,
      quantity: Number(item.quantity) || 1,
      price: Number(item.price) || 0,
      image: item.image || ''
    }));

    const { error: itemsError } = await supabase.from('order_items').upsert(finalOrderItems, { onConflict: 'order_id,product_id,weight' });
    if (itemsError) {
      console.error("Failed to insert COD order items notice:", itemsError.message);
    }

    // 📦 Inventory Stock Reduction
    for (const item of finalOrderItems) {
      if (item.product_id && item.quantity) {
        try {
          const { data: prod } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
          if (prod && typeof prod.stock === 'number') {
            const newStock = Math.max(0, prod.stock - item.quantity);
            await supabase.from('products').update({ stock: newStock }).eq('id', item.product_id);
          }
        } catch (e) {
          console.warn("Stock reduction warning for product:", item.product_id, e);
        }
      }
    }

    // Insert Payment Log
    const { error: paymentError } = await supabase.from('payments').insert([{
      order_id: newOrder.id,
      payment_id: finalOrderData.payment_id,
      razorpay_order_id: null,
      amount: orderPayload.total,
      method: 'COD',
      status: 'pending'
    }]);

    if (paymentError) {
      console.error("Failed to insert COD payment log:", paymentError);
    }

    // 5. Generate Invoice & send email confirmation
    await createInvoice(newOrder.id).catch((invoiceErr) => {
      console.log("Invoice background generation warning/failure for COD:", invoiceErr);
    });

    // Automatically create Shiprocket shipment for COD order
    try {
      const { createShiprocketOrder } = await import('@/lib/services/shiprocket/shipment');
      createShiprocketOrder(newOrder.id).catch((srErr) => console.error("Shiprocket COD creation error:", srErr));
    } catch (srErr) {
      console.warn("Non-fatal Shiprocket COD creation exception:", srErr);
    }

    // 6. WhatsApp Notification
    try {
      if (finalOrderData.user_phone) {
        await WhatsAppService.sendNotification('cod_confirmation', finalOrderData.user_phone, [finalOrderData.order_number, finalOrderData.total.toString()]);
      }
    } catch(err) {
      console.error("Failed to send COD whatsapp", err);
    }

    // 7. Dispatch Print Jobs to the print queue
    try {
      const { PrintingService } = await import('@/lib/services/printing');
      const { data: fullOrder } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', newOrder.id)
        .single();
        
      if (fullOrder) {
        const branchId = (fullOrder.shipping_address as any)?.branch_id || 'Main';
        await PrintingService.queueOrderPrints(fullOrder, branchId);
      }
    } catch (printErr) {
      console.error("Failed to queue print jobs in background during COD checkout:", printErr);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'COD Order created successfully',
      orderNumber: finalOrderData.order_number,
      paymentId: finalOrderData.payment_id
    });

  } catch (error: any) {
    console.error('Error creating COD order:', error);
    return NextResponse.json({ success: false, error: 'Failed to process COD order', details: error.message || error.stack || String(error) }, { status: 500 });
  }
}
