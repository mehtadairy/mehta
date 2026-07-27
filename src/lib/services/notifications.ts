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
}

export async function triggerOrderCancelled(order: any, reason: string, refundPending: boolean, customerEmail?: string) {
  const eventType = 'order_cancelled';
  if (!customerEmail) return;

  const { OrderCancelledEmail } = await import('@/emails/OrderCancelledEmail');
  const emailElement = React.createElement(OrderCancelledEmail, {
    customerName: order.user_name || "Customer",
    orderNumber: order.order_number,
    reason,
    refundPending
  });

  await sendReactEmail(customerEmail, `Order Cancelled - #${order.order_number}`, emailElement, eventType, order.id);
}

export async function triggerRefundProcessed(order: any, customerEmail?: string) {
  const eventType = 'refund_processed';
  if (!customerEmail) return;

  const { RefundProcessedEmail } = await import('@/emails/RefundProcessedEmail');
  const emailElement = React.createElement(RefundProcessedEmail, {
    customerName: order.user_name || "Customer",
    orderNumber: order.order_number,
    amount: String(order.total)
  });

  await sendReactEmail(customerEmail, `Refund Processed - #${order.order_number}`, emailElement, eventType, order.id);
}
