import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { WhatsAppService } from '../services/whatsapp';

export async function handleProductIntent(phone: string, text: string, session: any) {
  // Simple category greeting
  if (text.includes('hi') || text.includes('hello') || text.includes('menu')) {
    const categories = ['Milk Sweets', 'Dry Fruit', 'Farsan', 'Namkeen', 'Gift Boxes'];
    const message = `Welcome to Mehta Dairy! 🥛✨\n\nWhat would you like to order today?\n\n${categories.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\nReply with a number or category name to see products.`;
    
    // In production, this would use a WhatsApp Interactive List template.
    // For now, sending as custom message.
    await WhatsAppService.sendCustomMessage(phone, message);
    
    // Update session state
    await supabase
      .from('customer_sessions')
      .update({ current_state: 'browsing_categories' })
      .eq('phone', phone);
    return;
  }

  // If user replies with a category like "1" or "Milk Sweets"
  if (session.current_state === 'browsing_categories') {
    // Fetch products based on category. Let's just fetch popular ones as an example.
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .limit(5);

    if (!products || products.length === 0) {
      await WhatsAppService.sendCustomMessage(phone, "Sorry, no products found in this category right now.");
      return;
    }

    let productListMsg = `Here are some popular items:\n\n`;
    products.forEach((p, i) => {
      productListMsg += `${i + 1}. *${p.name}* - ₹${p.price}\n   ${p.weight_value} ${p.weight_unit}\n\n`;
    });
    productListMsg += `To add an item to your cart, reply with "Add [Item Name] [Quantity]". For example: "Add ${products[0].name} 1"`;

    await WhatsAppService.sendCustomMessage(phone, productListMsg);
    
    await supabase
      .from('customer_sessions')
      .update({ current_state: 'browsing_products' })
      .eq('phone', phone);
    return;
  }

  // Default fallback for product handler
  await WhatsAppService.sendCustomMessage(phone, "Please say 'Menu' to view our catalogue.");
}
