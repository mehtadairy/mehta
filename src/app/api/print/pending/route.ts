import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET(request: Request) {
  try {
    const { headers } = request;
    const apiKey = (process.env.PRINT_AGENT_API_KEY || '').replace(/['"]/g, '').trim();
    const rawClientKey = headers.get('x-print-agent-key') || headers.get('X-Print-Agent-Key') || '';
    const cleanClientKey = rawClientKey.replace(/['"]/g, '').trim();

    if (!apiKey || cleanClientKey !== apiKey) {
      console.warn('[PrintQueueAPI] Unauthorized poll attempt with key:', cleanClientKey);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch pending orders
    // Conditions: printed = false AND (payment_status = 'Paid' OR status = 'Confirmed' OR (payment_method = 'COD' AND status = 'Processing'))
    const { data: orders, error: ordersError } = await supabaseServer
      .from('orders')
      .select('*, order_items(*), invoices(*)')
      .eq('printed', false)
      .in('print_status', ['pending', 'reprint'])
      .order('created_at', { ascending: true });

    if (ordersError) {
      throw ordersError;
    }

    // Filter status conditions in memory to be absolutely bulletproof
    const pendingOrders = (orders || []).filter(o => {
      // Always allow reprints regardless of order status
      if (o.print_status === 'reprint') return true;

      const pStatus = o.payment_status?.toLowerCase();
      const status = o.status?.toLowerCase();
      const pMethod = o.payment_method?.toLowerCase();

      const isPaid = pStatus === 'paid';
      const isConfirmed = status === 'confirmed';
      const isCodProcessing = (pMethod === 'cod' && status === 'processing');

      return isPaid || isConfirmed || isCodProcessing;
    });

    // 2. Fetch printer configuration settings
    const { data: settings } = await supabaseServer
      .from('printer_settings')
      .select('*')
      .eq('branch', 'Main')
      .maybeSingle();

    const formattedOrders = pendingOrders.map(o => {
      const invoice = o.invoices && o.invoices.length > 0 ? o.invoices[0] : null;
      return {
        id: o.id,
        orderNumber: o.order_number,
        userName: o.user_name || 'Guest Customer',
        userPhone: o.user_phone || 'N/A',
        shippingAddress: typeof o.shipping_address === 'string'
          ? { street: o.shipping_address }
          : o.shipping_address || {},
        items: o.order_items ? o.order_items.map((i: any) => ({
          productName: i.product_name,
          weight: i.weight || 'Standard',
          quantity: i.quantity || 1,
          price: i.price || 0,
          subtotal: (i.price || 0) * (i.quantity || 1)
        })) : [],
        subtotal: o.subtotal || o.total || 0,
        deliveryCharge: o.delivery_charge || 0,
        discount: o.discount || 0,
        total: o.total || 0,
        paymentMethod: o.payment_method || 'Online',
        paymentStatus: o.payment_status || 'Pending',
        deliveryType: o.shipping_address?.id === 'pickup' ? 'Store Pickup' : 'Home Delivery',
        invoiceNumber: invoice ? invoice.invoice_number : 'INV-Awaiting',
        createdAt: o.created_at,
        isReprint: o.print_status === 'reprint'
      };
    });

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
      settings: settings || {
        selected_printer: '',
        paper_width: '80mm',
        auto_print_enabled: true,
        print_copies: 1,
        print_kitchen_receipt: true,
        print_packing_slip: true,
        auto_retry: true
      }
    });

  } catch (error: any) {
    console.error('[PrintQueueAPI] Failed to fetch print queue:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
