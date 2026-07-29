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

    // 1. Fetch pending print jobs from print_jobs table
    const { data: printJobs } = await supabaseServer
      .from('print_jobs')
      .select('*, orders(*, order_items(*), invoices(*))')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    let formattedOrders: any[] = [];

    if (printJobs && printJobs.length > 0) {
      formattedOrders = printJobs.map(job => {
        let escData: any = {};
        try {
          escData = typeof job.esc_pos_data === 'string' ? JSON.parse(job.esc_pos_data) : (job.esc_pos_data || {});
        } catch (e) {
          escData = {};
        }

        const order = job.orders;
        const invoice = order?.invoices && order.invoices.length > 0 ? order.invoices[0] : null;

        return {
          id: order?.id || job.order_id || job.id,
          jobId: job.id,
          orderNumber: order?.order_number || escData.orderNumber || 'UNKNOWN',
          userName: order?.user_name || escData.customerName || 'Guest Customer',
          userPhone: order?.user_phone || escData.customerPhone || 'N/A',
          shippingAddress: typeof order?.shipping_address === 'string'
            ? { street: order.shipping_address }
            : (order?.shipping_address || escData.shippingAddress || {}),
          items: (order?.order_items || escData.items || []).map((i: any) => ({
            productName: i.product_name || i.name || i.productName,
            weight: i.weight || 'Standard',
            quantity: i.quantity || i.qty || 1,
            price: i.price || 0,
            subtotal: (i.price || 0) * (i.quantity || i.qty || 1)
          })),
          subtotal: order?.subtotal || escData.subtotal || 0,
          deliveryCharge: order?.delivery_charge || escData.deliveryCharge || 0,
          discount: order?.discount || escData.discount || 0,
          total: order?.total || escData.total || 0,
          paymentMethod: order?.payment_method || 'Online',
          paymentStatus: order?.payment_status || escData.paymentStatus || 'Pending',
          deliveryType: (order?.shipping_address?.id === 'pickup' || escData.deliveryType === 'Store Pickup') ? 'Store Pickup' : 'Home Delivery',
          invoiceNumber: invoice ? invoice.invoice_number : 'INV-Awaiting',
          createdAt: job.created_at,
          isReprint: escData.isReprint || false,
          isCancellation: job.target_printer === 'cancellation' || escData.isCancellation === true || escData.printType === 'cancellation_slip',
          cancellationReason: escData.cancellationReason || order?.cancellation_reason || 'Customer Cancellation',
          printType: job.target_printer || escData.printType || 'billing'
        };
      });
    } else {
      // Fallback query directly on orders table for 100% backward compatibility
      const { data: orders } = await supabaseServer
        .from('orders')
        .select('*, order_items(*), invoices(*)')
        .eq('printed', false)
        .in('print_status', ['pending', 'reprint'])
        .order('created_at', { ascending: true });

      const pendingOrders = (orders || []).filter(o => {
        if (o.print_status === 'reprint') return true;
        const pStatus = o.payment_status?.toLowerCase();
        const status = o.status?.toLowerCase();
        const pMethod = o.payment_method?.toLowerCase();
        return pStatus === 'paid' || status === 'confirmed' || (pMethod === 'cod' && status === 'processing');
      });

      formattedOrders = pendingOrders.map(o => {
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
          isReprint: o.print_status === 'reprint',
          isCancellation: o.status === 'Cancelled' || o.status === 'Cancellation Requested',
          cancellationReason: o.cancellation_reason || 'Customer Cancellation',
          printType: 'billing'
        };
      });
    }

    // 2. Fetch printer configuration settings
    const { data: settings } = await supabaseServer
      .from('printer_settings')
      .select('*')
      .eq('branch', 'Main')
      .maybeSingle();

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
      settings: settings || {
        selected_printer: '',
        paper_width: '58mm',
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
