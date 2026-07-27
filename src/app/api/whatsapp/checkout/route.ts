import { NextResponse } from 'next/server';
import { checkoutCart } from '@/lib/services/whatsapp-cart-service';

export async function POST(req: Request) {
  console.log("========== /api/whatsapp/checkout HIT ==========");
  try {
    const body = await req.json();
    console.log("Incoming checkout payload:", body);
    
    const phone = body.phone || body.customerMobile;
    const { customerName, customerAddress, customerPincode } = body;

    if (!phone || !customerName || !customerAddress || !customerPincode) {
      console.log("Checkout Error: Missing fields", { phone, customerName, customerAddress, customerPincode });
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: phone/customerMobile, customerName, customerAddress, and customerPincode must be provided' 
      }, { status: 400 });
    }

    console.log("Calling checkoutCart() service...");
    const result = await checkoutCart({
      phone,
      customerName,
      customerAddress,
      customerPincode
    });
    
    console.log("checkoutCart() success:", result);

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    console.error('API WhatsApp Checkout Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal Server Error' 
    }, { status: 500 });
  }
}
