import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { WhatsAppService } from '../services/whatsapp';
import { handleCheckoutIntent } from './checkoutHandler';

export async function handleCartIntent(phone: string, text: string, session: any) {
  // Parse ADD intent: "Add Kaju Katli 2"
  if (text.startsWith('add ')) {
    const parts = text.split(' ');
    if (parts.length < 2) {
      await WhatsAppService.sendCustomMessage(phone, "Please specify what to add. Example: 'Add Kaju Katli 1'");
      return;
    }
    
    // Simplistic parsing: last part is quantity, rest is name.
    const qtyStr = parts[parts.length - 1];
    let quantity = parseInt(qtyStr);
    let productName = '';
    
    if (isNaN(quantity)) {
      quantity = 1;
      productName = parts.slice(1).join(' ');
    } else {
      productName = parts.slice(1, parts.length - 1).join(' ');
    }
    
    // Look up product (case-insensitive fuzzy match via ILIKE)
    const { data: products } = await supabase
      .from('products')
      .select('id, name, price, stock_quantity')
      .ilike('name', `%${productName}%`)
      .limit(1);

    if (!products || products.length === 0) {
      await WhatsAppService.sendCustomMessage(phone, `Sorry, we couldn't find a product matching "${productName}". Please try saying 'Menu' to view the catalogue.`);
      return;
    }
    
    const product = products[0];
    if (product.stock_quantity < quantity) {
      await WhatsAppService.sendCustomMessage(phone, `Sorry, we only have ${product.stock_quantity} of ${product.name} in stock.`);
      return;
    }
    
    // Update Cart in Session Context
    let currentCart = session.context?.cart || [];
    const existingItem = currentCart.find((i: any) => i.productId === product.id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      currentCart.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: quantity
      });
    }
    
    await supabase.from('customer_sessions').update({ 
      context: { ...session.context, cart: currentCart }
    }).eq('phone', phone);
    
    await WhatsAppService.sendCustomMessage(phone, `✅ Added ${quantity} x ${product.name} to your cart!\n\nReply with 'Cart' to view your order or 'Checkout' to proceed to payment.`);
    return;
  }
  
  if (text === 'cart' || text === 'view cart') {
    const cart = session.context?.cart || [];
    if (cart.length === 0) {
      await WhatsAppService.sendCustomMessage(phone, "Your cart is currently empty. Reply with 'Menu' to start shopping.");
      return;
    }
    
    let cartMsg = `*Your Shopping Cart* 🛒\n\n`;
    let total = 0;
    cart.forEach((item: any, idx: number) => {
      const lineTotal = item.price * item.quantity;
      total += lineTotal;
      cartMsg += `${idx + 1}. ${item.name}\n   ${item.quantity} x ₹${item.price} = ₹${lineTotal}\n`;
    });
    
    cartMsg += `\n*Total: ₹${total}*\n\nReply with 'Checkout' to place your order, or 'Clear Cart' to empty it.`;
    await WhatsAppService.sendCustomMessage(phone, cartMsg);
    return;
  }
  
  if (text === 'clear cart') {
    await supabase.from('customer_sessions').update({ 
      context: { ...session.context, cart: [] }
    }).eq('phone', phone);
    await WhatsAppService.sendCustomMessage(phone, "Your cart has been cleared. Reply with 'Menu' to browse again.");
    return;
  }
  
  if (text === 'checkout' || text === 'buy') {
    await handleCheckoutIntent(phone, text, session);
    return;
  }
  
  await WhatsAppService.sendCustomMessage(phone, "I didn't understand that cart command. Please use 'Add [Item]', 'Cart', or 'Checkout'.");
}
