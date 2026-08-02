import { supabaseServer as supabase } from '@/lib/supabaseServer';

export class PrintingService {
  /**
   * Dispatches standard print jobs to the print_jobs queue.
   */
  static async queueOrderPrints(order: any, branchId: string = 'Main', isReprint: boolean = false) {
    try {
      console.log(`[PrintingService] Queueing print jobs for order ${order.order_number || order.id} (Reprint: ${isReprint})`);
      
      // Always clean up existing pending print jobs for this order to prevent concurrent race conditions (e.g. verify + webhook)
      if (order.id) {
        await supabase
          .from('print_jobs')
          .delete()
          .eq('order_id', order.id)
          .eq('status', 'pending');
      }

      // Check if order has already been successfully printed (and this is not an explicit reprint request)
      if (!isReprint) {
        const { data: printedJobs } = await supabase
          .from('print_jobs')
          .select('id, status')
          .eq('order_id', order.id)
          .eq('status', 'printed');

        if (printedJobs && printedJobs.length > 0) {
          console.log(`[PrintingService] Print job already executed for order ${order.id}. Skipping duplicate trigger.`);
          return;
        }
      }

      // Load print toggles from database configuration (omitted print_billing as it does not exist)
      const { data: printerSettings, error: printSettingsErr } = await supabase
        .from('printer_settings')
        .select('branch, print_kitchen_receipt, print_packing_slip, paper_width')
        .eq('branch', branchId)
        .maybeSingle();

      if (printSettingsErr) {
        console.error(`[PrintingService] Error fetching printer settings:`, printSettingsErr.message);
      }

      const queues = [];
      const printBilling = true; // Always default true for billing since column doesn't exist
      const printKitchen = printerSettings?.print_kitchen_receipt === true;
      const printPacking = printerSettings?.print_packing_slip === true;

      console.log(`[PrintingService] Print Config loaded for Branch '${branchId}': Billing=${printBilling}, Kitchen=${printKitchen}, Packing=${printPacking}`);

      if (printBilling) queues.push('billing');
      if (printKitchen) queues.push('kitchen');
      if (printPacking) queues.push('packing');

      // Default to single billing receipt if no specific queue is configured
      if (queues.length === 0) queues.push('billing');
      
      // Determine items list
      const items = order.items || order.order_items || [];
      const formattedItems = items.map((i: any) => ({
        name: i.productName || i.product_name,
        qty: Number(i.quantity || i.qty) || 1,
        weight: i.weight,
        price: Number(i.price) || 0,
        line_total: (Number(i.price) || 0) * (Number(i.quantity || i.qty) || 1)
      }));

      // Cleanly format shipping address for printing
      let addressStr = '';
      let shippingName = '';
      let shippingPhone = '';
      if (order.shipping_address) {
        const addr = order.shipping_address;
        shippingName = addr.name || addr.full_name || '';
        shippingPhone = addr.phone || addr.mobile || '';

        if (addr.id === 'pickup') {
          addressStr = `Self Pickup: ${addr.street || ''}`;
        } else {
          const parts = [
            addr.flat || addr.street || addr.address || '',
            addr.area || '',
            addr.landmark ? `Landmark: ${addr.landmark}` : '',
            `${addr.city || ''} - ${addr.pincode || ''}`
          ].filter(Boolean);
          addressStr = parts.join(', ');
        }
      }

      // Base JSON payload for Print Agent
      const payload = {
        orderId: order.id,
        orderNumber: order.orderNumber || order.order_number,
        customerName: order.userName || order.user_name || 'Guest',
        customerPhone: order.userPhone || order.user_phone,
        shippingName: shippingName,
        shippingPhone: shippingPhone,
        shippingAddress: addressStr || 'N/A',
        subtotal: order.subtotal,
        deliveryCharge: order.delivery_charge || order.deliveryCharge || 0,
        discount: order.discount || 0,
        deliveryType: order.delivery_type || order.deliveryType || 'Home',
        total: order.total,
        date: order.created_at || order.createdAt || new Date().toISOString(),
        paymentStatus: order.paymentStatus || order.payment_status || 'Pending',
        items: formattedItems,
        trackingUrl: `https://mehtadairy.com/tracking?id=${order.id}`,
        isReprint: isReprint,
        paperWidth: printerSettings?.paper_width || '58mm',
        shopPhone: '9913252232',
        shopEmail: 'support@mehtadairy.com',
        shopGST: '24ACKPM9230A2ZW',
        shopFSSAI: '10713006000140'
      };

      const jobs = [];
      for (const target of queues) {
        jobs.push({
          order_id: order.id,
          branch_id: branchId,
          target_printer: target,
          status: 'pending',
          esc_pos_data: JSON.stringify({ ...payload, printType: target })
        });
      }

      if (jobs.length > 0) {
        await supabase.from('print_jobs').insert(jobs);
        console.log(`[PrintingService] Queued ${jobs.length} job(s) (${queues.join(', ')}) for order ${order.id}.`);
      }

      // Mark order print status as pending
      await supabase.from('orders').update({ printed: false, print_status: 'pending' }).eq('id', order.id);

    } catch (err) {
      console.error("[PrintingService] Failed to queue print jobs:", err);
    }
  }

  /**
   * Dispatches ORDER CANCELLED slip to the print queue.
   */
  static async queueOrderCancellationPrint(order: any, reason: string = 'Customer Request', branchId: string = 'Main') {
    try {
      console.log(`[PrintingService] Queueing CANCELLED ORDER slip for order ${order.order_number || order.id}...`);

      // Prevent duplicate cancellation slip queueing
      const { data: existingCancelJob } = await supabase
        .from('print_jobs')
        .select('id')
        .eq('order_id', order.id)
        .eq('target_printer', 'cancellation')
        .maybeSingle();

      if (existingCancelJob) {
        console.log(`[PrintingService] Cancellation slip already queued for order ${order.id}. Skipping duplicate.`);
        return;
      }

      const items = order.items || order.order_items || [];
      const formattedItems = items.map((i: any) => ({
        name: i.productName || i.product_name,
        qty: Number(i.quantity || i.qty) || 1,
        weight: i.weight,
        price: Number(i.price) || 0,
        line_total: (Number(i.price) || 0) * (Number(i.quantity || i.qty) || 1)
      }));

      const cancellationPayload = {
        printType: 'cancellation_slip',
        isCancellation: true,
        header: '*** ORDER CANCELLED ***',
        orderId: order.id,
        orderNumber: order.order_number || order.orderNumber,
        customerName: order.user_name || order.userName || 'Guest Customer',
        customerPhone: order.user_phone || order.userPhone || 'N/A',
        orderDate: order.created_at || order.createdAt || new Date().toISOString(),
        cancellationDate: new Date().toISOString(),
        paymentStatus: order.payment_status || 'Pending',
        refundStatus: order.payment_status === 'Refund Pending' ? 'Refund Pending' : (order.payment_method === 'COD' ? 'N/A' : 'Processing'),
        cancellationReason: reason,
        items: formattedItems,
        total: order.total || 0,
        paperWidth: '58mm',
        shopPhone: '9913252232'
      };

      await supabase.from('print_jobs').insert([{
        order_id: order.id,
        branch_id: branchId,
        target_printer: 'cancellation',
        status: 'pending',
        esc_pos_data: JSON.stringify(cancellationPayload)
      }]);

      // Update orders print_status
      await supabase.from('orders').update({ printed: false, print_status: 'pending' }).eq('id', order.id);

      console.log(`[PrintingService] Cancellation slip queued successfully for order ${order.order_number || order.id}.`);
    } catch (err) {
      console.error('[PrintingService] Failed to queue cancellation print slip:', err);
    }
  }
}
