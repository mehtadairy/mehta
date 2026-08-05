import { NextResponse } from 'next/server';
import { getShippingSettings, calculateSlabShipping } from '@/lib/services/shipping-calculator';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pincode, state, cart = [] } = body || {};

    const settings = await getShippingSettings();
    const calculation = calculateSlabShipping(cart, { pincode, state }, settings);

    return NextResponse.json({
      success: true,
      serviceable: true,
      deliveryCharge: calculation.totalShippingCharge,
      estimatedDeliveryTime: calculation.estimatedDeliveryTime,
      zone: calculation.zone,
      chargeableWeightKg: calculation.chargeableWeightKg,
      ratePerKg: calculation.ratePerKg,
      totalWeightKg: calculation.totalWeightKg,
      settings
    });
  } catch (error: any) {
    console.error('Delivery calculation API error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pincode = searchParams.get('pincode') || undefined;
    const state = searchParams.get('state') || undefined;

    const settings = await getShippingSettings();
    const calculation = calculateSlabShipping([], { pincode, state }, settings);

    return NextResponse.json({
      success: true,
      serviceable: true,
      deliveryCharge: calculation.totalShippingCharge,
      estimatedDeliveryTime: calculation.estimatedDeliveryTime,
      zone: calculation.zone,
      ratePerKg: calculation.ratePerKg,
      settings
    });
  } catch (error: any) {
    console.error('Delivery calculation API error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
