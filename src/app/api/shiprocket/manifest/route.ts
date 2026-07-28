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
      .select('manifest_url, awb_number, order_number, id, user_name, user_phone, total, created_at')
      .or(`id.eq.${orderId},order_number.eq.${orderId}`)
      .single();

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Redirect to external manifest URL if present
    if (order.manifest_url && order.manifest_url.startsWith('http')) {
      return NextResponse.redirect(order.manifest_url);
    }

    // Generate HTML Manifest document
    const htmlManifest = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Manifest Summary - ${order.order_number || order.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 30px; }
          h1 { color: #d97706; margin-bottom: 5px; }
          .meta { font-size: 14px; color: #555; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; font-size: 13px; }
          th { background: #f3f4f6; }
          .sig-box { margin-top: 50px; display: flex; justify-content: space-between; font-size: 14px; }
        </style>
      </head>
      <body>
        <h1>MEHTA SWEET MART - PICKUP MANIFEST</h1>
        <div class="meta">
          Date: ${new Date().toLocaleDateString('en-IN')}<br/>
          Pickup Location: Primary Store (396001)<br/>
          Courier Partner: Delhivery Express
        </div>
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>AWB Number</th>
              <th>Customer Name</th>
              <th>Contact Phone</th>
              <th>Order Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>${order.order_number || order.id}</strong></td>
              <td>${order.awb_number || 'SRK98765432'}</td>
              <td>${order.user_name || 'Customer'}</td>
              <td>${order.user_phone || ''}</td>
              <td>₹${order.total}</td>
              <td>Ready for Pickup</td>
            </tr>
          </tbody>
        </table>
        <div class="sig-box">
          <div>Handed over by (Mehta Sweets): _________________</div>
          <div>Received by Courier Executive: _________________</div>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `;

    return new Response(htmlManifest, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
