import { NextResponse } from 'next/server';
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

    const awbNumber = order.awb_number || order.shiprocket_shipments?.[0]?.awb_number;
    let liveTrackingData = null;

    // 2. Try fetching live status from Shiprocket API if AWB exists
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
        shippingAddress: order.shipping_address,
        createdAt: order.created_at,
        items: order.order_items
      },
      liveTracking: liveTrackingData
    });

  } catch (error: any) {
    console.error('Tracking route error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
