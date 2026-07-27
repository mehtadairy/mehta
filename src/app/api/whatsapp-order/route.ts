import { NextResponse } from 'next/server';
import { createWhatsAppOrder } from '@/lib/services/whatsapp-order-service';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("========== RAW REQUEST ==========");
    console.log(JSON.stringify(body, null, 2));
    console.log("================================");

    const { 
      customerName, 
      customerMobile, 
      customerAddress, 
      customerPincode, 
      product, 
      quantity 
    } = body;

    console.log("Parsed Validation Fields:", {
      customerName,
      customerMobile,
      customerAddress,
      customerPincode,
      product,
      quantity,
    });

    // 1. Validate all required fields
    if (!customerName || !customerMobile || !customerAddress || !customerPincode || !product || !quantity) {
      console.error("Validation Failed", {
        customerName,
        customerMobile,
        customerAddress,
        customerPincode,
        product,
        quantity,
      });
      const responsePayload = { 
        success: false, 
        message: 'Validation failed' 
      };
      console.log("Returning Response [400]:", JSON.stringify(responsePayload, null, 2));
      return NextResponse.json(responsePayload, { status: 400 });
    }

    // 2. Call shared service
    let result;
    try {
      console.log("Executing createWhatsAppOrder shared service...");
      result = await createWhatsAppOrder({
        customerName,
        customerMobile,
        customerAddress,
        customerPincode,
        items: [{ productIdOrName: product, quantity: parseInt(quantity.toString(), 10) || 1 }]
      });
      console.log("createWhatsAppOrder completed successfully. Result:", JSON.stringify(result, null, 2));
    } catch (serviceErr: any) {
      console.error("createWhatsAppOrder service threw an exception:", serviceErr);
      throw serviceErr;
    }

    // 3. Mark the order source as 'whatsapp' (handling case where column might not exist yet)
    try {
      console.log(`Setting order source to whatsapp for orderId: ${result.orderId}`);
      const { error: updateError } = await supabaseServer
        .from('orders')
        .update({ source: 'whatsapp' })
        .eq('id', result.orderId);

      if (updateError) {
        console.warn("Failed to set order source. Schema may need updating. Error:", updateError.message);
      } else {
        console.log("Successfully marked order source as whatsapp");
      }
    } catch (dbErr) {
      console.error("Exception setting order source:", dbErr);
    }

    const responsePayload = {
      success: true,
      orderId: result.orderId
    };
    console.log("Returning Response [200]:", JSON.stringify(responsePayload, null, 2));
    return NextResponse.json(responsePayload);

  } catch (error: any) {
    console.error("WhatsApp Create Order Error:", error);
    const responsePayload = { 
      success: false, 
      message: 'Failed to create order',
      error: error.message || error
    };
    console.log("Returning Response [500]:", JSON.stringify(responsePayload, null, 2));
    return NextResponse.json(responsePayload, { status: 500 });
  }
}
