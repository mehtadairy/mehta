import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'orderId parameter is required' }, { status: 400 });
    }

    const { data: order } = await supabase
      .from('orders')
      .select('shipping_label_url, awb_number, order_number, id, user_name, user_phone, shipping_address, order_items(*)')
      .or(`id.eq.${orderId},order_number.eq.${orderId}`)
      .single();

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // If external URL exists, redirect directly
    if (order.shipping_label_url && order.shipping_label_url.startsWith('http')) {
      return NextResponse.redirect(order.shipping_label_url);
    }

    // Generate lightweight HTML Shipping Label preview for admin
    const rawAddr = order.shipping_address || {};
    const htmlLabel = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Shipping Label - ${order.order_number || order.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; background: #f9f9f9; }
          .label-box { width: 400px; margin: auto; border: 3px solid #000; padding: 20px; background: #fff; border-radius: 8px; }
          .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
          .title { font-size: 20px; font-weight: bold; }
          .awb { font-size: 16px; font-weight: bold; margin-top: 5px; letter-spacing: 1px; }
          .address-section { font-size: 13px; line-height: 1.5; margin-bottom: 15px; }
          .barcode { text-align: center; margin: 15px 0; font-family: monospace; font-size: 24px; letter-spacing: 4px; border: 1px dashed #666; padding: 10px; background: #eee; }
          .items { font-size: 12px; border-top: 1px solid #ccc; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="label-box">
          <div class="header">
            <div class="title">MEHTA SWEET MART</div>
            <div>Shipped Via: Delhivery Express</div>
            <div class="awb">AWB: ${order.awb_number || 'SRK98765432'}</div>
          </div>
          <div class="barcode">*${order.awb_number || order.order_number}*</div>
          <div class="address-section">
            <strong>SHIP TO:</strong><br/>
            ${order.user_name || 'Customer'}<br/>
            ${rawAddr.street || rawAddr.address || ''}<br/>
            ${rawAddr.city || ''}, ${rawAddr.state || ''} - ${rawAddr.pincode || ''}<br/>
            Phone: ${order.user_phone || ''}
          </div>
          <div class="items">
            <strong>ORDER #${order.order_number || order.id}</strong><br/>
            Items: ${(order.order_items || []).map((i: any) => `${i.product_name} (${i.weight || '500g'} x${i.quantity})`).join(', ') || 'Fresh Sweets'}
          </div>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `;

    return new Response(htmlLabel, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
