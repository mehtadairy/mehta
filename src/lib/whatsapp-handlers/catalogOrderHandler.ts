import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { WhatsAppService } from '../services/whatsapp';
import { createWhatsAppOrder } from '../services/whatsapp-order-service';

export async function handleCatalogOrder(phone: string, orderData: any) {
  try {
    if (!orderData || !orderData.product_items || orderData.product_items.length === 0) {
      await WhatsAppService.sendCustomMessage(phone, "We received your cart, but it seems to be empty. Please try selecting items from the catalog again.");
      return;
    }

    // 1. Resolve customer profile and default address from phone number
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const { data: customer } = await supabase
      .from('customers')
      .select('id, name')
      .eq('phone', cleanPhone)
      .maybeSingle();

    let customerName = customer?.name || "WhatsApp Customer";
    let customerAddress = "WhatsApp Order";
    let customerPincode = "380001"; // Fallback default pincode

    if (customer?.id) {
      const { data: addressData } = await supabase
        .from('addresses')
        .select('address, pincode, full_name, state')
        .eq('customer_id', customer.id)
        .eq('is_default', true)
        .maybeSingle();

      if (addressData) {
        customerAddress = addressData.address;
        customerPincode = addressData.pincode;
        customerName = addressData.full_name || customerName;
      } else {
        const { data: anyAddress } = await supabase
          .from('addresses')
          .select('address, pincode, full_name, state')
          .eq('customer_id', customer.id)
          .limit(1)
          .maybeSingle();

        if (anyAddress) {
          customerAddress = anyAddress.address;
          customerPincode = anyAddress.pincode;
          customerName = anyAddress.full_name || customerName;
        }
      }
    }

    // 2. Map Meta product_items to items payload for WhatsApp order service
    const items = orderData.product_items.map((item: any) => ({
      productIdOrName: item.product_retailer_id, // Retailer ID maps to SKU, name, or product ID
      quantity: parseInt(item.quantity, 10) || 1
    }));

    // 3. Create the order
    const result = await createWhatsAppOrder({
      customerName,
      customerMobile: cleanPhone,
      customerAddress,
      customerPincode,
      items
    });

    // 4. Generate checkoutUrl
    const checkoutUrl = `https://www.mehtadairy.com/checkout?order=${result.orderId}`;

    // 5. Build order summary text
    let summaryText = `*Mehta Dairy Order Summary* 📦\n`;
    summaryText += `---------------------------------\n`;
    result.items.forEach((item, idx) => {
      summaryText += `${idx + 1}. *${item.product_name}*\n   Qty: ${item.quantity} x ₹${item.price} = ₹${item.price * item.quantity}\n`;
    });
    summaryText += `---------------------------------\n`;
    summaryText += `*Grand Total: ₹${result.amount}*\n\n`;
    summaryText += `Please complete your secure online payment by clicking the link below:\n`;
    summaryText += `${checkoutUrl}`;

    // 6. Send the message back to the customer
    await WhatsAppService.sendCustomMessage(phone, summaryText);

  } catch (err: any) {
    console.error("Error processing catalog order message:", err);
    await WhatsAppService.sendCustomMessage(phone, "Sorry, we encountered an error while processing your cart. Please try sending it again or contact support.");
  }
}
