import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth-utils';
import { createShiprocketOrder } from '@/lib/services/shiprocket/shipment';

export async function POST(request: Request) {
  try {
    // 🔒 Security Authorization Check
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('mehta_admin_token')?.value;
    const workerToken = cookieStore.get('mehta_worker_token')?.value;
    const internalTrigger = request.headers.get('x-internal-trigger') === 'true';

    let isAuthorized = internalTrigger;

    if (!isAuthorized && adminToken) {
      const adminPayload = await verifySession(adminToken);
      if (adminPayload?.role === 'super_admin') isAuthorized = true;
    }

    if (!isAuthorized && workerToken) {
      const workerPayload = await verifySession(workerToken);
      if (workerPayload?.employeeId) isAuthorized = true;
    }

    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin or Worker authentication required' }, { status: 401 });
    }

    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    const result = await createShiprocketOrder(orderId);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error: any) {
    console.error('Shipment creation route error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
