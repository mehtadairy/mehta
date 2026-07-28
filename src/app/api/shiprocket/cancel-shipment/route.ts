import { NextResponse } from 'next/server';
import { cancelShiprocketOrder } from '@/lib/services/shiprocket/returns';

export async function POST(request: Request) {
  try {
    const { orderId, reason } = await request.json();

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    const result = await cancelShiprocketOrder(orderId, reason);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Cancel shipment route error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
