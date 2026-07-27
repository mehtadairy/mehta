import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { WhatsAppService } from '../services/whatsapp';
import Razorpay from 'razorpay';

export async function handleCheckoutIntent(phone: string, text: string, session: any) {
  const cart = session.context?.cart || [];
  
  if (cart.length === 0) {
    await WhatsAppService.sendCustomMessage(phone, "Your cart is empty. Please add items before checking out. Reply with 'Menu'.");
    return;
  }

  // State Machine for Checkout
  if (session.current_state !== 'awaiting_checkout_flow') {
    // Start Checkout Flow
    await WhatsAppService.sendCustomMessage(phone, "Great! Let's get your delivery details.\n\nPlease reply with your full delivery address (House No, Street, Landmark).");
    
    await supabase.from('customer_sessions').update({ 
      current_state: 'awaiting_checkout_flow',
      context: { ...session.context, checkout_step: 'address' }
    }).eq('phone', phone);
    return;
  }

  const step = session.context.checkout_step;

  if (step === 'address') {
    await supabase.from('customer_sessions').update({ 
      context: { ...session.context, checkout_step: 'city_pin', address: text }
    }).eq('phone', phone);
    
    await WhatsAppService.sendCustomMessage(phone, "Got it. Now please reply with your City and Pincode (e.g., 'Surat 395007').");
    return;
  }

  if (step === 'city_pin') {
    const cityPin = text;
    const address = session.context.address;
    
    // Calculate total
    let totalAmount = 0;
    cart.forEach((item: any) => { totalAmount += item.price * item.quantity; });
    
    // Create Order in Supabase
    const { data: order, error: orderError } = await supabase.from('orders').insert([{
      customer_id: session.customer_id, // Could be null if guest, ideally we create customer
      phone_number: phone,
      total_amount: totalAmount,
      status: 'pending',
      payment_status: 'pending',
      delivery_address: `${address}, ${cityPin}`,
      order_items: cart // store JSON of cart for simplicity in this demo
    }]).select().single();

    if (orderError || !order) {
      console.error('Order creation error:', orderError);
      await WhatsAppService.sendCustomMessage(phone, "Sorry, there was an error creating your order. Please try again later.");
      return;
    }

    // Generate Razorpay Payment Link
    let paymentLink = 'https://rzp.io/mock/link';
    try {
      const rzp = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || '',
        key_secret: process.env.RAZORPAY_KEY_SECRET || ''
      });
      
      const linkParams = {
        amount: totalAmount * 100, // paise
        currency: 'INR',
        accept_partial: false,
        reference_id: order.id,
        description: `Order from Mehta Dairy`,
        customer: {
          contact: phone.replace('91', ''),
        },
        notify: {
          sms: false,
          email: false
        },
        reminder_enable: false
      };
      
      const rzpLink = await rzp.paymentLink.create(linkParams);
      paymentLink = rzpLink.short_url;
    } catch (rzpErr) {
      console.error('Razorpay Link Gen Error:', rzpErr);
      // Fallback to mock link if Razorpay keys are invalid
    }

    // Reset session state
    await supabase.from('customer_sessions').update({ 
      current_state: 'idle',
      context: { cart: [] }
    }).eq('phone', phone);
    
    const msg = `🎉 Order Created Successfully!\n\n*Order ID:* ${order.id.split('-')[0].toUpperCase()}\n*Total Amount:* ₹${totalAmount}\n*Delivery To:* ${address}, ${cityPin}\n\nPlease complete your payment using this secure link:\n${paymentLink}\n\nOnce paid, you will receive an order confirmation and invoice.`;
    
    await WhatsAppService.sendCustomMessage(phone, msg);
    return;
  }
}
