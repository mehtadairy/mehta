import { WhatsAppService } from '../services/whatsapp';

export async function handleSupportIntent(phone: string, text: string, session: any) {
  // Simple heuristic/keyword based FAQ matching
  const t = text.toLowerCase();

  let response = '';

  if (t.includes('time') || t.includes('open') || t.includes('hours')) {
    response = "🕒 *Store Timings*\nWe are open from 8:00 AM to 10:00 PM, all 7 days of the week!";
  } else if (t.includes('location') || t.includes('where') || t.includes('address')) {
    response = "📍 *Location*\nWe are located at 123 Main Street, Surat, Gujarat. You can also order online for home delivery.";
  } else if (t.includes('delivery charge') || t.includes('shipping')) {
    response = "🚚 *Delivery Charges*\nFree delivery on orders above ₹500! Standard delivery charge is ₹40 for orders below ₹500.";
  } else if (t.includes('return') || t.includes('refund') || t.includes('cancel')) {
    response = "🔄 *Return Policy*\nIf you are not satisfied with the quality, please report it within 2 hours of delivery for a replacement or refund.";
  } else if (t.includes('sugar free')) {
    response = "🍬 *Sugar-Free Sweets*\nYes, we have a dedicated range of Sugar-Free Sweets! Reply 'Menu' to explore the catalogue.";
  } else {
    // Generic fallback
    response = "I'm your Mehta Dairy Assistant 🐄\n\nYou can ask me things like:\n- What are your store timings?\n- Track my order\n- Show me the Menu\n- View Cart";
  }

  await WhatsAppService.sendCustomMessage(phone, response);
}
