import { NextResponse } from 'next/server';
import { calculateDeliveryCharge } from '@/lib/services/delivery-service';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pincode = searchParams.get('pincode')?.trim();
    const subtotalStr = searchParams.get('subtotal') || '0';
    const subtotal = parseFloat(subtotalStr);

    if (!pincode) {
      return NextResponse.json(
        { success: false, error: 'Pincode is required' },
        { status: 400 }
      );
    }

    const result = await calculateDeliveryCharge(pincode, subtotal);

    if (!result.success) {
      const status = result.error?.includes('Database') ? 500 : 404;
      return NextResponse.json(
        { success: false, error: result.error || 'Delivery not available.' },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      city: result.city || 'Serviceable Area',
      deliveryCharge: result.deliveryCharge,
      estimatedDeliveryTime: result.estimatedDeliveryTime || '1-2 Days',
      freeDeliveryEligible: result.freeDeliveryEligible
    }, { status: 200 });

  } catch (error: any) {
    console.error('Delivery check API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
