import { NextResponse } from 'next/server';
import { triggerOrderConfirmation } from '@/lib/services/notifications';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { order, customerEmail, customerPhone } = body;

    if (!order) {
      return NextResponse.json({ success: false, error: "Order details required" }, { status: 400 });
    }

    // Process notifications in the background or await them
    await triggerOrderConfirmation(order, customerEmail, customerPhone);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Notification API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
