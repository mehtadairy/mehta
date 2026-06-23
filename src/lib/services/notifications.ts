import { Resend } from 'resend';
import { supabase } from '@/lib/supabaseClient';
import { BUSINESS } from '@/lib/businessConfig';
import * as React from 'react';

// Email Templates
import { OrderConfirmationEmail } from '@/emails/OrderConfirmationEmail';
import { PaymentReceivedEmail } from '@/emails/PaymentReceivedEmail';
import { OrderShippedEmail } from '@/emails/OrderShippedEmail';
import { OrderDeliveredEmail } from '@/emails/OrderDeliveredEmail';
import { AdminOrderNotificationEmail } from '@/emails/AdminOrderNotificationEmail';

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'orders@mehtadairy.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'orders@mehtadairy.com';

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY || '';
const MSG91_SENDER_ID = process.env.MSG91_SENDER_ID || 'MEHTA';

// --- LOGGING ---
async function logNotification(
  orderId: string | undefined, 
  recipient: string, 
  type: 'email' | 'sms' | 'whatsapp', 
  status: 'sent' | 'failed', 
  eventType: string, 
  errorMessage: string | null = null
) {
  try {
    await supabase.from('notification_logs').insert([{
      order_id: orderId,
      [type === 'email' ? 'customer_email' : 'customer_phone']: recipient,
      type,
      status,
      event_type: eventType,
      error_message: errorMessage
    }]);
  } catch (err) {
    console.error("Failed to log notification:", err);
  }
}

// --- EMAIL ENGINE ---
export async function sendReactEmail(to: string, subject: string, reactComponent: React.ReactElement, eventType: string, orderId?: string) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_mock_key') {
    console.log(`[Email Mock Simulation] Sending to ${to}: Subject: ${subject}`);
    await logNotification(orderId, to, 'email', 'sent', eventType, "[Simulated Mode] Email mock succeeded");
    return { success: true, data: { id: `mock_${Date.now()}` } };
  }

  try {
    const data = await resend.emails.send({
      from: `${BUSINESS.name} <${SENDER_EMAIL}>`,
      to,
      subject,
      react: reactComponent,
    });

    if (data.error) {
      throw new Error(data.error.message);
    }

    await logNotification(orderId, to, 'email', 'sent', eventType);
    return { success: true, data };
  } catch (error: any) {
    await logNotification(orderId, to, 'email', 'failed', eventType, error.message);
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
}

// --- MSG91 SMS ENGINE ---
export async function sendMSG91SMS(phone: string, message: string, templateId: string, eventType: string, orderId?: string) {
  if (!MSG91_AUTH_KEY) {
    console.log(`[MSG91 Mock] Sending to ${phone}: ${message}`);
    await logNotification(orderId, phone, 'sms', 'sent', eventType, "[Simulated Mode] SMS mock succeeded");
    return { success: true };
  }

  try {
    // Convert 10-digit number to 91XXXXXXXXXX
    const cleanPhone = phone.replace(/\D/g, '');
    const mobile = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const options = {
      method: 'POST',
      headers: {
        'authkey': MSG91_AUTH_KEY,
        'accept': 'application/json',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: MSG91_SENDER_ID,
        route: "4", // Transactional route
        country: "91",
        sms: [
          {
            message: message,
            to: [mobile]
          }
        ],
        template_id: templateId // Ensure the template is approved in MSG91 dashboard
      })
    };

    const response = await fetch('https://api.msg91.com/api/v5/flow/', options);
    const result = await response.json();

    if (result.type === 'error') {
      throw new Error(result.message || "MSG91 API Error");
    }

    await logNotification(orderId, phone, 'sms', 'sent', eventType);
    return { success: true, data: result };
  } catch (error: any) {
    await logNotification(orderId, phone, 'sms', 'failed', eventType, error.message);
    console.error('Failed to send SMS:', error);
    return { success: false, error };
  }
}

// --------------------------------------------------------
// TRIGGERS
// --------------------------------------------------------

export async function triggerOrderConfirmation(order: any, customerEmail?: string, customerPhone?: string) {
  const eventType = 'order_confirmation';
  
  // Build items array
  const items = order.items || [];
  
  // 1. Email Customer
  if (customerEmail) {
    const emailElement = React.createElement(OrderConfirmationEmail, {
      customerName: order.user_name || "Customer",
      orderNumber: order.order_number,
      totalAmount: String(order.total),
      shippingAmount: String(order.delivery_charge || 0),
      subtotalAmount: String((order.total || 0) - (order.delivery_charge || 0)),
      paymentMethod: order.payment_method || "Online",
      deliveryAddress: order.shipping_address ? `${order.shipping_address.street}, ${order.shipping_address.city}` : "N/A",
      items: items.map((i: any) => ({
        name: i.productName,
        quantity: i.quantity,
        price: i.price,
        weight: i.weight
      }))
    });
    
    await sendReactEmail(customerEmail, `Order Confirmed - #${order.order_number}`, emailElement, eventType, order.id);
  }

  // 2. SMS Customer
  if (customerPhone) {
    // In production, ensure this EXACT text matches an approved MSG91 DLT template
    const smsMessage = `${BUSINESS.shortName}:\n\nYour order #${order.order_number} has been confirmed.\n\nAmount: ₹${order.total}\n\nThank you for shopping with us.`;
    const templateId = process.env.MSG91_TEMPLATE_CONFIRM || 'template_mock_id';
    await sendMSG91SMS(customerPhone, smsMessage, templateId, eventType, order.id);
  }

  // 3. Email Admin
  const adminEmailElement = React.createElement(AdminOrderNotificationEmail, {
    orderNumber: order.order_number,
    customerName: order.user_name || "Customer",
    customerPhone: customerPhone || "N/A",
    customerEmail: customerEmail || "N/A",
    deliveryAddress: order.shipping_address ? `${order.shipping_address.street}, ${order.shipping_address.city}` : "N/A",
    totalAmount: String(order.total),
    paymentStatus: order.payment_status || "Pending",
    items: items.map((i: any) => ({
      name: i.productName,
      quantity: i.quantity,
      price: i.price
    }))
  });

  await sendReactEmail(ADMIN_EMAIL, `🚨 New Order: #${order.order_number}`, adminEmailElement, 'admin_new_order', order.id);
}

export async function triggerPaymentReceived(order: any, customerEmail?: string) {
  const eventType = 'payment_received';
  if (!customerEmail) return;

  const emailElement = React.createElement(PaymentReceivedEmail, {
    customerName: order.user_name || "Customer",
    orderNumber: order.order_number,
    amount: String(order.total)
  });

  await sendReactEmail(customerEmail, `Payment Received - #${order.order_number}`, emailElement, eventType, order.id);
}

export async function triggerOrderShipped(order: any, trackingNumber: string, courierName: string, trackingLink: string, customerEmail?: string, customerPhone?: string) {
  const eventType = 'order_shipped';

  if (customerEmail) {
    const emailElement = React.createElement(OrderShippedEmail, {
      customerName: order.user_name || "Customer",
      orderNumber: order.order_number,
      courierName: courierName,
      trackingNumber: trackingNumber,
      trackingLink: trackingLink
    });

    await sendReactEmail(customerEmail, `Your Order Has Been Shipped`, emailElement, eventType, order.id);
  }

  if (customerPhone) {
    const smsMessage = `${BUSINESS.shortName}:\n\nOrder #${order.order_number} has been shipped.\n\nTracking ID: ${trackingNumber}\n\nThank you.`;
    const templateId = process.env.MSG91_TEMPLATE_SHIPPED || 'template_mock_id';
    await sendMSG91SMS(customerPhone, smsMessage, templateId, eventType, order.id);
  }
}

export async function triggerOrderDelivered(order: any, customerEmail?: string, customerPhone?: string) {
  const eventType = 'order_delivered';

  if (customerEmail) {
    const emailElement = React.createElement(OrderDeliveredEmail, {
      customerName: order.user_name || "Customer",
      orderNumber: order.order_number
    });

    await sendReactEmail(customerEmail, `Order Delivered`, emailElement, eventType, order.id);
  }

  if (customerPhone) {
    const smsMessage = `${BUSINESS.shortName}:\n\nOrder #${order.order_number} has been delivered.\n\nThank you for choosing ${BUSINESS.shortName}.`;
    const templateId = process.env.MSG91_TEMPLATE_DELIVERED || 'template_mock_id';
    await sendMSG91SMS(customerPhone, smsMessage, templateId, eventType, order.id);
  }
}
