import { supabaseServer as supabase } from '@/lib/supabaseServer';

export class PrintingService {
  /**
   * Dispatches print jobs to the queue.
   * Assumes 3 jobs by default: kitchen, billing, packing (unless specified).
   */
  static async queueOrderPrints(order: any, branchId: string = 'Main', isReprint: boolean = false) {
    try {
      console.log(`[PrintingService] Queueing print jobs for order ${order.order_number || order.id} (Reprint: ${isReprint})`);
      
      // If it is a reprint, delete any existing print jobs for this order first
      if (isReprint) {
        await supabase
          .from('print_jobs')
          .delete()
          .eq('order_id', order.id);
      }
      
      // Prevent duplicate printing queue entries for the same order
      const { data: existingJobs } = await supabase
        .from('print_jobs')
        .select('target_printer')
        .eq('order_id', order.id);
        
      const existingPrinters = existingJobs?.map(j => j.target_printer) || [];
      const jobs = [];
      
      // Load print toggles from database configuration
      const { data: printerSettings } = await supabase
        .from('printer_settings')
        .select('*')
        .eq('branch', branchId)
        .maybeSingle();

      // Load print toggles from database configuration
      const queues = [];
      if (printerSettings?.print_billing !== false) queues.push('billing');
      if (printerSettings?.print_kitchen === true) queues.push('kitchen');
      if (printerSettings?.print_packing !== false) queues.push('packing');
      // Always ensure at least packing is queued if nothing matches
      if (queues.length === 0) queues.push('packing');
      
      // Determine items list
      const items = order.items || order.order_items || [];
      const formattedItems = items.map((i: any) => ({
        name: i.productName || i.product_name,
        qty: i.quantity,
        weight: i.weight,
        price: i.price
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

      // Base JSON payload for Print Agent to render into ESC/POS
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
        paymentStatus: order.paymentStatus || order.payment_status,
        items: formattedItems,
        trackingUrl: `https://mehtadairy.com/tracking?id=${order.id}`,
        isReprint: isReprint,
        paperWidth: '58mm', // Forcing 58mm because their physical printer truncates 80mm
        shopPhone: '9913252232',
        shopEmail: 'support@mehtadairy.com',
        shopGST: '24ACKPM9230A2ZW',
        shopFSSAI: '10713006000140'
      };

      for (const target of queues) {
        if (existingPrinters.includes(target)) {
          console.log(`[PrintingService] Print job for '${target}' already exists for order ${order.id}. Skipping duplicate.`);
          continue;
        }
        jobs.push({
          order_id: order.id,
          branch_id: branchId,
          target_printer: target,
          status: 'pending',
          esc_pos_data: JSON.stringify({ ...payload, printType: target })
        });
      }

      if (jobs.length === 0) {
        console.log(`[PrintingService] No new print jobs to queue for order ${order.id}.`);
        return;
      }

      const { error } = await supabase.from('print_jobs').insert(jobs);
      if (error) throw error;
      
      console.log(`[PrintingService] Queued ${jobs.length} jobs successfully.`);
    } catch (err) {
      console.error("[PrintingService] Failed to queue print jobs:", err);
    }
  }
}
