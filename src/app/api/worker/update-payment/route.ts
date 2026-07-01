import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(request: Request) {
  try {
    const { paymentId, status } = await request.json();

    if (!paymentId || !status) {
      return NextResponse.json({ error: 'Missing paymentId or status' }, { status: 400 });
    }

    const { error: paymentError } = await supabaseServer
      .from('payments')
      .update({ status })
      .eq('id', paymentId);

    if (paymentError) throw paymentError;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Worker payment update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
