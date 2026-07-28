import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession, verifyCustomerSession } from '@/lib/auth-utils';
import { createReturnShipment } from '@/lib/services/shiprocket/returns';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('mehta_admin_token')?.value;
    const customerToken = cookieStore.get('mehta_customer_token')?.value;

    let isAuthorized = false;

    if (adminToken) {
      const adminPayload = await verifySession(adminToken);
      if (adminPayload?.role === 'super_admin') isAuthorized = true;
    }

    if (!isAuthorized && customerToken) {
      const customerPayload = await verifyCustomerSession(customerToken);
      if (customerPayload?.id) isAuthorized = true;
    }

    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Authentication required to create return shipment' }, { status: 401 });
    }

    const { orderId, reason } = await request.json();

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    const result = await createReturnShipment(orderId, reason);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Return shipment route error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
