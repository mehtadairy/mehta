import { NextResponse } from 'next/server';
import { calculateDeliveryCharge } from '@/lib/services/delivery-service';
import { calculateCartTotalWeight } from '@/lib/order-utils';

export async function POST(req: Request) {
  try {
    const { state, cart } = await req.json();

    if (!state || !cart || cart.length === 0) {
      return NextResponse.json({ success: false, error: 'State and cart items are required' });
    }

    const totalWeightKg = calculateCartTotalWeight(cart);
    
    // Calculate delivery charge using our new DB-driven engine
    const result = await calculateDeliveryCharge(state, totalWeightKg);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[Delivery Check API Error]', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
