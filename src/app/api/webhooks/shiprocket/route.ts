import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { sendShippingNotification } from '@/lib/services/shiprocket/notifications';

/**
 * Handles incoming webhooks from Shiprocket for automatic status updates.
 */
export async function POST(request: Request) {
  const startTime = Date.now();
  console.log('[ShiprocketWebhook] Received webhook at /api/webhooks/shiprocket');

  try {
    const rawBody = await request.text();
    const headers = request.headers;
    const configuredSecret = process.env.SHIPROCKET_WEBHOOK_SECRET || 'shiprocket_wh_secret_mehta_2026';

    // 1. Security Verification: Validate secret header if provided
    const receivedSecret = headers.get('x-shiprocket-secret') || headers.get('x-api-key') || '';
    if (configuredSecret && receivedSecret && receivedSecret !== configuredSecret) {
      console.warn('[ShiprocketWebhook] Webhook authentication failed: invalid secret header.');
      return NextResponse.json({ error: 'Unauthorized webhook request' }, { status: 401 });
    }

    if (!rawBody || rawBody.trim() === '') {
      return NextResponse.json({ status: 'ok', detail: 'empty body' });
    }

    const payload = JSON.parse(rawBody);
    console.log('[ShiprocketWebhook] Webhook payload event:', payload.current_status || payload.event);

    const awb = payload.awb || payload.awb_code || payload.tracking_number;
    const srOrderId = payload.order_id || payload.shiprocket_order_id;
    const currentStatus = payload.current_status || payload.status;
    const courierName = payload.courier_name || 'Courier Partner';
    const etd = payload.etd || payload.edd;

    if (!awb && !srOrderId) {
      console.warn('[ShiprocketWebhook] Webhook missing awb or order_id');
      return NextResponse.json({ status: 'ok', detail: 'missing order identifier' });
    }

    // 2. Resolve internal order in Supabase DB
    let order: any = null;

    if (awb) {
      const { data } = await supabase
        .from('orders')
        .select('*, shiprocket_shipments(*)')
        .eq('awb_number', String(awb))
        .maybeSingle();
      order = data;
    }

    if (!order && srOrderId) {
      const { data } = await supabase
        .from('orders')
        .select('*, shiprocket_shipments(*)')
        .eq('shiprocket_order_id', Number(srOrderId))
        .maybeSingle();
      order = data;
    }

    if (!order) {
      console.warn(`[ShiprocketWebhook] Order not matched in DB for AWB ${awb} or SR Order ID ${srOrderId}`);
      return NextResponse.json({ status: 'ok', detail: 'order_not_found' });
    }

    // 3. Status Mapping Logic
    let dbStatus = order.status;
    let dbShipmentStatus = currentStatus;
    let statusEventNotification: 'CREATED' | 'PICKED_UP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | null = null;

    const normalizedStatus = String(currentStatus).toUpperCase();

    if (normalizedStatus.includes('PICK') || normalizedStatus.includes('PICKED UP')) {
      dbStatus = 'Ready For Pickup';
      dbShipmentStatus = 'Picked Up';
      statusEventNotification = 'PICKED_UP';
    } else if (normalizedStatus.includes('TRANSIT') || normalizedStatus.includes('IN TRANSIT')) {
      dbStatus = 'Shipped';
      dbShipmentStatus = 'In Transit';
    } else if (normalizedStatus.includes('OUT FOR DELIVERY')) {
      dbStatus = 'Shipped';
      dbShipmentStatus = 'Out For Delivery';
      statusEventNotification = 'OUT_FOR_DELIVERY';
    } else if (normalizedStatus.includes('DELIVERED')) {
      dbStatus = 'Delivered';
      dbShipmentStatus = 'Delivered';
      statusEventNotification = 'DELIVERED';
    } else if (normalizedStatus.includes('CANCEL') || normalizedStatus.includes('CANCELED')) {
      dbStatus = 'Cancelled';
      dbShipmentStatus = 'Cancelled';
      statusEventNotification = 'CANCELLED';
    } else if (normalizedStatus.includes('RTO') || normalizedStatus.includes('RETURN')) {
      dbStatus = 'Cancelled';
      dbShipmentStatus = 'Returned';
    } else if (normalizedStatus.includes('NDR') || normalizedStatus.includes('FAILED')) {
      dbShipmentStatus = 'Delivery Failed';
    }

    // 4. Update Database Tables
    const updatePayload: any = {
      status: dbStatus,
      shipment_status: dbShipmentStatus
    };
    if (etd) updatePayload.delivery_eta = etd;

    await supabase.from('orders').update(updatePayload).eq('id', order.id);

    await supabase.from('shiprocket_shipments').update({
      current_shipment_status: dbShipmentStatus,
      updated_at: new Date().toISOString()
    }).eq('order_id', order.id);

    // Audit log
    await supabase.from('shipping_logs').insert([{
      order_id: order.id,
      action: 'WEBHOOK',
      request_payload: payload,
      response_payload: { updatedStatus: dbShipmentStatus },
      status: 'SUCCESS',
      created_at: new Date().toISOString()
    }]);

    console.log(`[ShiprocketWebhook] Order ${order.order_number || order.id} updated to status: ${dbShipmentStatus}`);

    // 5. Trigger Notifications if state transitioned
    if (statusEventNotification) {
      await sendShippingNotification({
        orderId: order.id,
        orderNumber: order.order_number || order.id,
        customerName: order.user_name || 'Customer',
        customerPhone: order.user_phone || '',
        customerEmail: order.user_email || '',
        courierName: courierName,
        awbNumber: awb || order.awb_number || '',
        trackingUrl: order.tracking_url || `https://mehtadairy.com/tracking?id=${order.order_number || order.id}`,
        deliveryEta: etd || order.delivery_eta || '2-3 Days',
        statusEvent: statusEventNotification
      }).catch(e => console.warn('Webhook notification warning:', e));
    }

    const elapsed = Date.now() - startTime;
    return NextResponse.json({
      status: 'ok',
      orderId: order.id,
      updatedShipmentStatus: dbShipmentStatus,
      elapsedMs: elapsed
    });

  } catch (error: any) {
    console.error('[ShiprocketWebhook] Webhook error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
