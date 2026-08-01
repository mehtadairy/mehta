import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

import { verifySession } from '@/lib/auth-utils';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    // 🔒 1. Strict Worker Authentication
    const cookieStore = await cookies();
    const workerToken = cookieStore.get('mehta_worker_token')?.value;
    const authPayload = workerToken ? await verifySession(workerToken) : null;
    
    if (!authPayload || !authPayload.employeeId) {
      return NextResponse.json({ error: 'Unauthorized: Valid worker session required' }, { status: 401 });
    }

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
