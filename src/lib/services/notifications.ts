import { Resend } from 'resend';
import { supabase } from '@/lib/supabaseClient';

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'onboarding@resend.dev';

export async function sendEmail(to: string, subject: string, html: string, eventType: string, orderId?: string) {
  try {
    const data = await resend.emails.send({
      from: `Mehta Sweet Mart <${SENDER_EMAIL}>`,
      to,
      subject,
      html,
    });

    // Log success
    await supabase.from('notification_logs').insert([{
      order_id: orderId,
      customer_email: to,
      type: 'email',
      status: 'sent',
      event_type: eventType,
      error_message: null
    }]);

    return { success: true, data };
  } catch (error: any) {
    // Log failure
    await supabase.from('notification_logs').insert([{
      order_id: orderId,
      customer_email: to,
      type: 'email',
      status: 'failed',
      event_type: eventType,
      error_message: error.message
    }]);
    
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
}

export async function sendWhatsApp(to: string, message: string, eventType: string, orderId?: string) {
  // Placeholder for WhatsApp Provider (MSG91, AiSensy, etc.)
  try {
    console.log(`[WhatsApp Mock] Sending to ${to}: ${message}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Log success
    await supabase.from('notification_logs').insert([{
      order_id: orderId,
      customer_phone: to,
      type: 'whatsapp',
      status: 'sent',
      event_type: eventType,
      error_message: null
    }]);

    return { success: true };
  } catch (error: any) {
    // Log failure
    await supabase.from('notification_logs').insert([{
      order_id: orderId,
      customer_phone: to,
      type: 'whatsapp',
      status: 'failed',
      event_type: eventType,
      error_message: error.message
    }]);

    console.error('Failed to send WhatsApp:', error);
    return { success: false, error };
  }
}

// --------------------------------------------------------
// TRIGGER FUNCTIONS
// --------------------------------------------------------

export async function triggerOrderConfirmation(order: any, customerEmail?: string, customerPhone?: string) {
  const eventType = 'order_confirmation';
  
  // 1. WhatsApp
  if (customerPhone) {
    const waMessage = `*Mehta Sweet Mart*\n\nHello ${order.user_name},\nYour order ${order.order_number} has been confirmed!\nTotal: ₹${order.total}\nWe will notify you once it's shipped.`;
    await sendWhatsApp(customerPhone, waMessage, eventType, order.id);
  }

  // 2. Email
  if (customerEmail) {
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #D46D2D; text-align: center;">Mehta Sweet Mart</h2>
        <h3 style="text-align: center;">Order Confirmed!</h3>
        <p>Dear ${order.user_name},</p>
        <p>Thank you for your purchase. Your order <strong>${order.order_number}</strong> is confirmed.</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Total Amount:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${order.total}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Payment Status:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${order.payment_status}</td></tr>
        </table>
        <p style="margin-top: 30px; text-align: center; color: #888; font-size: 12px;">Crafting premium sweets since 1952.</p>
      </div>
    `;
    await sendEmail(customerEmail, `Order Confirmation - ${order.order_number}`, emailHtml, eventType, order.id);
  }
  
  // 3. Admin Notification (WhatsApp)
  const adminPhone = process.env.ADMIN_WHATSAPP || '919999999999';
  const adminMessage = `*NEW ORDER ALERT*\n\nOrder ID: ${order.order_number}\nCustomer: ${order.user_name}\nAmount: ₹${order.total}\nPayment: ${order.payment_status}`;
  await sendWhatsApp(adminPhone, adminMessage, 'admin_new_order', order.id);
}
