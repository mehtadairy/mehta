import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession, verifyCustomerSession } from '@/lib/auth-utils';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { getShiprocketToken } from '@/lib/services/shiprocket/auth';

const SHIPROCKET_TRACKING_URL = 'https://apiv2.shiprocket.in/v1/external/courier/track/awb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const trackingId = searchParams.get('id') || searchParams.get('awb');

    if (!trackingId) {
      return NextResponse.json({ error: 'Tracking ID or AWB is required' }, { status: 400 });
    }

    // 1. Fetch order from Supabase
    const { data: order } = await supabase
      .from('orders')
      .select('*, order_items(*), shiprocket_shipments(*)')
      .or(`order_number.eq.${trackingId},id.eq.${trackingId},awb_number.eq.${trackingId}`)
      .maybeSingle();

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 🔒 2. Authorization & Privacy Check (IDOR Protection)
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('mehta_admin_token')?.value;
    const customerToken = cookieStore.get('mehta_customer_token')?.value;

    let isAuthorizedUser = false;

    if (adminToken) {
      const adminPayload = await verifySession(adminToken);
      if (adminPayload?.role === 'super_admin') isAuthorizedUser = true;
    }

    if (!isAuthorizedUser && customerToken) {
      const customerPayload = await verifyCustomerSession(customerToken);
      if (customerPayload?.id && (order.customer_id === customerPayload.id || order.user_phone === customerPayload.phone)) {
        isAuthorizedUser = true;
      }
    }

    const rawAddr = order.shipping_address || {};
    const sanitizedAddress = isAuthorizedUser
      ? rawAddr
      : {
          city: rawAddr.city || 'City',
          state: rawAddr.state || 'State',
          pincode: rawAddr.pincode || '******',
          street: '***** Street Address (Redacted for Privacy) *****',
        };

    const awbNumber = order.awb_number || order.shiprocket_shipments?.[0]?.awb_number;
    let liveTrackingData = null;

    // 3. Fetch live status from Shiprocket API if AWB exists
    if (awbNumber) {
      try {
        const authRes = await getShiprocketToken();
        if (authRes.success && authRes.token && !authRes.isFallback) {
          const res = await fetch(`${SHIPROCKET_TRACKING_URL}/${awbNumber}`, {
            headers: { 'Authorization': `Bearer ${authRes.token}` },
            cache: 'no-store'
          });
          if (res.ok) {
            const data = await res.json();
            liveTrackingData = data?.tracking_data || data;
          }
        }
      } catch (e) {
        console.warn('Live Shiprocket tracking query notice:', e);
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.order_number || order.id,
        status: order.shipment_status || order.status,
        paymentStatus: order.payment_status,
        courierName: order.courier_name || 'Delhivery Express',
        awbNumber: awbNumber || 'AWB-PENDING',
        trackingUrl: order.tracking_url || `https://shiprocket.co/tracking/${awbNumber}`,
        deliveryEta: order.delivery_eta || '2-4 Days',
        shippingAddress: sanitizedAddress,
        createdAt: order.created_at,
        items: (order.order_items || []).map((item: any) => ({
          name: item.product_name || item.name,
          weight: item.weight,
          quantity: item.quantity
        }))
      },
      liveTracking: liveTrackingData
    });

  } catch (error: any) {
    console.error('Tracking route error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
