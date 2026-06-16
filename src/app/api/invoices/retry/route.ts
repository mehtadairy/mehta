import { NextResponse } from 'next/server';
import { retryFailedInvoices } from '@/lib/services/invoices';

export async function POST() {
  try {
    const retriedCount = await retryFailedInvoices();
    return NextResponse.json({ success: true, retriedCount });
  } catch (err: any) {
    console.error("Retry invoices API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
