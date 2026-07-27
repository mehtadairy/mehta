import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { handleProductIntent } from './productHandler';
import { handleCartIntent } from './cartHandler';
import { handleTrackingIntent } from './trackingHandler';
import { handleSupportIntent } from './supportHandler';
import { WhatsAppService } from '../services/whatsapp';
import { handleCatalogOrder } from './catalogOrderHandler';

export async function handleWhatsAppMessage(msg: any) {
  const phone = msg.from;

  // Intercept Commerce Catalog Order/Cart Messages
  if (msg.type === 'order' || msg.order) {
    await handleCatalogOrder(phone, msg.order);
    return;
  }

  let text = '';
  
  if (msg.type === 'text') {
    text = msg.message?.text || msg.text?.body || '';
  } else if (msg.type === 'interactive' || msg.type === 'button') {
    // AiSensy interactive messages (quick replies/lists)
    text = msg.interactive?.button_reply?.title 
        || msg.interactive?.list_reply?.title 
        || msg.button?.text 
        || '';
  }

  text = text.toLowerCase().trim();
  if (!text) return;

  // 1. Manage Customer Session State
  let { data: session } = await supabase
    .from('customer_sessions')
    .select('*')
    .eq('phone', phone)
    .single();

  if (!session) {
    // Attempt to link to a customer if they exist
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', phone.replace('91', '')) // Assumes standard 10 digit local format for lookups
      .single();

    const newSession = {
      phone,
      customer_id: customer ? customer.id : null,
      current_state: 'idle',
      context: {}
    };

    await supabase.from('customer_sessions').insert([newSession]);
    session = newSession;
  }

  // 2. Intent Routing Logic
  // Check if session has a forced state (e.g. waiting for address input)
  if (session.current_state === 'awaiting_checkout_flow') {
      await handleCartIntent(phone, text, session);
      return;
  }

  if (['hi', 'hello', 'hey', 'menu', 'products', 'sweets'].some(w => text.includes(w))) {
    await handleProductIntent(phone, text, session);
  } else if (['cart', 'add', 'remove', 'buy', 'checkout'].some(w => text.includes(w))) {
    await handleCartIntent(phone, text, session);
  } else if (['track', 'order', 'status'].some(w => text.includes(w))) {
    await handleTrackingIntent(phone, text, session);
  } else if (['points', 'rewards', 'coupons'].some(w => text.includes(w))) {
    // Simple direct response for loyalty for now
    await WhatsAppService.sendCustomMessage(phone, "You currently have 150 points. You can redeem them on your next order!");
  } else {
    // Fallback to AI Customer Support / FAQs
    await handleSupportIntent(phone, text, session);
  }
}
