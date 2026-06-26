import { NextResponse } from 'next/server';
import { createInvoice } from '@/lib/services/invoices';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    if (!orderId) return NextResponse.json({ error: 'Missing orderId' });

    await createInvoice(orderId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, stack: err.stack });
  }
}
