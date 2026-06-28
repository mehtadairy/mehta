import { Resend } from "resend";
import { supabase } from "@/lib/supabaseClient";

const resend = new Resend(process.env.RESEND_API_KEY || "re_mock_key");
const SENDER_EMAIL = process.env.SENDER_EMAIL || "orders@mehtadairy.com";

// Helper for exponential backoff
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function sendInvoiceEmailWithRetry(
  invoiceId: string, 
  email: string, 
  pdfBuffer?: Buffer,
  maxRetries = 3
): Promise<{ success: boolean; message: string }> {
  let attempt = 0;

  // 1. Fetch full invoice & order details for the template
  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, orders(*)")
    .eq("id", invoiceId)
    .single();

  if (!invoice) return { success: false, message: "Invoice not found in DB." };

  // Parse order data (works whether joined or saved in metadata)
  const order = invoice.orders || invoice.metadata || {};
  const orderNumber = order.order_number || invoice.invoice_number;
  const invoiceNumber = invoice.invoice_number;
  const userName = invoice.metadata?.user_name || order.user_name || "Valued Customer";
  const total = Number(invoice.metadata?.total || order.total || 0).toFixed(2);
  const paymentMethod = invoice.metadata?.payment_method || order.payment_method || "Online";
  const paymentStatus = (invoice.metadata?.payment_status || order.payment_status || "COMPLETED").toUpperCase();
  const orderDate = new Date(invoice.created_at).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const addr = order.shipping_address || invoice.metadata?.shipping_address;
  let addressString = "Store Pickup";
  if (addr && addr.street) {
    addressString = `${addr.street}, ${addr.city}, ${addr.state} - ${addr.pincode}`;
  } else if (addr && typeof addr === 'string') {
    addressString = addr;
  }

  const items = order.order_items || invoice.metadata?.items || [];
  
  let itemsHtml = '';
  if (items && items.length > 0) {
    itemsHtml = items.map((item: any) => `
      <div style="display: flex; align-items: center; padding: 16px 0; border-bottom: 1px solid #EAE3D2;">
        <div style="flex-grow: 1;">
          <h4 style="margin: 0 0 4px 0; font-size: 15px; color: #2C2C2C;">${item.product_name || item.name}</h4>
          <p style="margin: 0; font-size: 13px; color: #777;">Variant: ${item.weight || "Standard"} | Qty: ${item.quantity || item.qty}</p>
        </div>
        <div style="flex-shrink: 0; text-align: right;">
          <p style="margin: 0; font-weight: 600; font-size: 15px; color: #2C2C2C;">₹${(Number(item.price) * Number(item.quantity || item.qty)).toFixed(2)}</p>
        </div>
      </div>
    `).join('');
  }

  // 2. Build the Premium Order Confirmation HTML Template
  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation - Mehta Dairy</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #F4F4F5; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .container { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; }
        .header { text-align: center; padding: 32px 20px 24px 20px; background-color: #FCF9F2; border-bottom: 1px solid #EAE3D2; }
        .content { padding: 32px 24px; }
        .card { background-color: #FAFAFA; border: 1px solid #EAE3D2; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
        .card-title { font-size: 14px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 0; margin-bottom: 16px; border-bottom: 1px solid #EAE3D2; padding-bottom: 8px; }
        .grid-2 { display: table; width: 100%; margin-bottom: 8px; }
        .grid-col { display: table-cell; width: 50%; padding-bottom: 12px; }
        .label { font-size: 12px; color: #777; margin: 0 0 4px 0; }
        .value { font-size: 14px; color: #2C2C2C; font-weight: 500; margin: 0; }
        .btn { display: inline-block; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 15px; text-decoration: none; text-align: center; }
        .btn-primary { background-color: #D46D2D; color: #FFFFFF; }
        .btn-secondary { background-color: #FFFFFF; color: #333333; border: 1px solid #D1D5DB; }
        .tracker { display: table; width: 100%; text-align: center; margin: 10px 0; }
        .step { display: table-cell; position: relative; width: 25%; font-size: 11px; color: #999; font-weight: 600; }
        .step.active { color: #D46D2D; }
        .dot { width: 12px; height: 12px; border-radius: 50%; background-color: #E5E7EB; margin: 0 auto 8px auto; position: relative; z-index: 2; }
        .step.active .dot { background-color: #D46D2D; box-shadow: 0 0 0 3px rgba(212,109,45,0.2); }
        .footer { background-color: #1F2937; color: #9CA3AF; padding: 32px 24px; text-align: center; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- HEADER -->
        <div class="header">
          <img src="https://mehtadairy.com/logo.png" alt="Mehta Dairy" style="height: 48px; margin-bottom: 24px;" />
          <h1 style="margin: 0 0 8px 0; font-size: 28px; color: #2C2C2C;">Order Confirmed ✅</h1>
          <p style="margin: 0; font-size: 16px; color: #555;">Hi ${userName}, thank you for your order!</p>
        </div>

        <div class="content">
          <p style="font-size: 16px; line-height: 1.6; color: #444; margin-top: 0; margin-bottom: 24px;">
            Your order has been confirmed successfully and is now being prepared. We've attached your official tax invoice as a PDF for your records.
          </p>

          <!-- ORDER SUMMARY CARD -->
          <div class="card">
            <h3 class="card-title">Order Summary</h3>
            <div class="grid-2">
              <div class="grid-col">
                <p class="label">Order Number</p>
                <p class="value">#${orderNumber}</p>
              </div>
              <div class="grid-col">
                <p class="label">Invoice Number</p>
                <p class="value">${invoiceNumber}</p>
              </div>
            </div>
            <div class="grid-2">
              <div class="grid-col">
                <p class="label">Order Date</p>
                <p class="value">${orderDate}</p>
              </div>
              <div class="grid-col">
                <p class="label">Expected Delivery</p>
                <p class="value">Within 2-3 Days</p>
              </div>
            </div>
            <div class="grid-2">
              <div class="grid-col">
                <p class="label">Payment Method</p>
                <p class="value">${paymentMethod}</p>
              </div>
              <div class="grid-col">
                <p class="label">Payment Status</p>
                <p class="value" style="color: ${paymentStatus === 'PAID' ? '#059669' : '#D97706'}">${paymentStatus}</p>
              </div>
            </div>
            <div style="margin-top: 8px; padding-top: 16px; border-top: 1px dashed #EAE3D2;">
              <p class="label">Delivery Address</p>
              <p class="value" style="line-height: 1.5;">${addressString}</p>
            </div>
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #EAE3D2; display: table; width: 100%;">
              <div style="display: table-cell; width: 50%;">
                <p style="margin:0; font-size: 16px; font-weight: 600; color: #2C2C2C;">Grand Total</p>
              </div>
              <div style="display: table-cell; width: 50%; text-align: right;">
                <p style="margin:0; font-size: 20px; font-weight: 800; color: #D46D2D;">₹${total}</p>
              </div>
            </div>
          </div>

          <!-- PRODUCTS -->
          ${itemsHtml ? `
          <div class="card" style="padding: 12px 20px;">
            <h3 class="card-title" style="margin-bottom: 0;">Items Ordered</h3>
            ${itemsHtml}
          </div>
          ` : ''}

          <!-- WHAT'S NEXT -->
          <div class="card" style="text-align: center; padding: 24px 20px;">
            <h3 class="card-title" style="text-align: left;">What's Next?</h3>
            <div class="tracker">
              <div class="step active">
                <div class="dot"></div>
                Confirmed
              </div>
              <div class="step">
                <div class="dot"></div>
                Preparing
              </div>
              <div class="step">
                <div class="dot"></div>
                Shipped
              </div>
              <div class="step">
                <div class="dot"></div>
                Delivered
              </div>
            </div>
          </div>

          <!-- ACTION BUTTONS -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="https://mehtadairy.com/reorder?id=${invoiceNumber}" class="btn btn-primary" style="margin-right: 12px; margin-bottom: 12px; width: 140px;">Track Order</a>
            <a href="https://mehtadairy.com" class="btn btn-secondary" style="margin-bottom: 12px; width: 140px;">Buy Again</a>
          </div>

          <!-- NEED HELP -->
          <div style="text-align: center; margin-top: 32px; padding: 20px; background-color: #F8F5F0; border-radius: 12px;">
            <p style="margin: 0 0 12px 0; font-weight: 600; font-size: 14px; color: #2C2C2C;">Need Help With Your Order?</p>
            <p style="margin: 0; font-size: 13px; color: #666;">
              <a href="tel:+919913252232" style="color: #D46D2D; text-decoration: none;">+91 99132 52232</a> &nbsp;|&nbsp; 
              <a href="https://wa.me/919913252232" style="color: #D46D2D; text-decoration: none;">WhatsApp Us</a>
            </p>
            <p style="margin: 8px 0 0 0; font-size: 13px; color: #666;">
              <a href="mailto:support@mehtadairy.com" style="color: #D46D2D; text-decoration: none;">support@mehtadairy.com</a> &nbsp;|&nbsp; 
              <a href="https://mehtadairy.com" style="color: #D46D2D; text-decoration: none;">mehtadairy.com</a>
            </p>
          </div>
        </div>

        <!-- FOOTER -->
        <div class="footer">
          <p style="margin: 0 0 8px 0; font-weight: 600; color: #E5E7EB;">Thank you for choosing Mehta Dairy.</p>
          <p style="margin: 0 0 20px 0;">Serving Premium Sweets Since 1972.</p>
          <p style="margin: 0; font-size: 11px; color: #6B7280;">Taleti Rd, Navagadh, Jeshar, Palitana, Gujarat - 364270</p>
          <p style="margin: 8px 0 0 0; font-size: 11px; color: #6B7280;">© ${new Date().getFullYear()} Mehta Dairy & Sweet Mart. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const attachments = [];
  if (pdfBuffer) {
    attachments.push({
      filename: `Invoice-${invoice.invoice_number}.pdf`,
      content: pdfBuffer.toString("base64"),
    });
  }

  // 3. Send via Resend with Exponential Backoff Retries
  while (attempt <= maxRetries) {
    try {
      const { data, error } = await resend.emails.send({
        from: `Mehta Dairy <${SENDER_EMAIL}>`,
        to: email,
        bcc: "orders@mehtadairy.com",
        subject: `Your Mehta Dairy Order is Confirmed! (#${orderNumber})`,
        html: htmlTemplate,
        attachments: attachments.length > 0 ? attachments : undefined
      });

      if (error) {
        console.warn(`Attempt ${attempt + 1}: Resend API error: ${error.message}`);
      } else {
        return { success: true, message: `Email sent via Resend` };
      }
    } catch (err: any) {
      console.error(`Attempt ${attempt + 1}: Exception sending email:`, err);
    }
    
    attempt++;
    if (attempt <= maxRetries) {
      const waitTime = Math.pow(2, attempt) * 1000;
      await delay(waitTime);
    }
  }

  return { success: false, message: "Failed to send email after max retries." };
}
