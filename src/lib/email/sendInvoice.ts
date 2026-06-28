import { Resend } from "resend";
import { supabase } from "@/lib/supabaseClient";

const resend = new Resend(process.env.RESEND_API_KEY || "re_mock_key");
const SENDER_EMAIL = process.env.SENDER_EMAIL || "orders@mehtadairy.com";

// Helper for exponential backoff
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function sendInvoiceEmailWithRetry(
  invoiceId: string, 
  email: string, 
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
  const userName = invoice.metadata?.user_name || order.user_name || "Customer";
  const total = Number(invoice.metadata?.total || order.total || 0).toFixed(2);
  const paymentMethod = invoice.metadata?.payment_method || order.payment_method || "Online";
  const orderDate = new Date(invoice.created_at).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  // 2. Build the Mehta Dairy Branded HTML Template
  const htmlTemplate = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #faf9f8; color: #2C2C2C; padding: 20px; border-radius: 12px; border: 1px solid #EAE3D2;">
      <div style="text-align: center; margin-bottom: 24px;">
        <img src="https://mehtadairy.com/logo.png" alt="Mehta Dairy" style="height: 60px; object-fit: contain;" />
      </div>
      
      <div style="background: white; padding: 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <h2 style="color: #F17A28; margin-top: 0; font-size: 24px;">Thank you for your order, ${userName}!</h2>
        <p style="font-size: 16px; line-height: 1.5; color: #555;">
          Your order has been successfully placed. Your official invoice <strong>#${invoice.invoice_number}</strong> is ready. You can view and download it anytime using the button below.
        </p>

        <div style="text-align: center; margin-top: 24px; margin-bottom: 24px;">
          <a href="https://mehtadairy.com/invoice/${invoice.invoice_number}" style="display: inline-block; background-color: #F17A28; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 16px;">View & Download Invoice</a>
        </div>

        <div style="background-color: #faf9f8; border: 1px solid #EAE3D2; padding: 20px; border-radius: 8px; margin: 24px 0;">
          <h3 style="margin-top: 0; font-size: 18px; border-bottom: 1px solid #EAE3D2; padding-bottom: 8px;">Order Summary</h3>
          <table style="width: 100%; font-size: 14px; color: #444;">
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">Order Date:</td>
              <td style="padding: 6px 0; text-align: right;">${orderDate}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">Order Number:</td>
              <td style="padding: 6px 0; text-align: right;">#${orderNumber}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">Payment Method:</td>
              <td style="padding: 6px 0; text-align: right;">${paymentMethod}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0 6px 0; font-weight: bold; font-size: 16px; border-top: 1px solid #EAE3D2;">Grand Total:</td>
              <td style="padding: 12px 0 6px 0; text-align: right; font-weight: bold; font-size: 16px; color: #F17A28;">₹${total}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin-top: 32px; margin-bottom: 16px;">
          <a href="https://mehtadairy.com/reorder?id=${invoice.invoice_number}" style="display: inline-block; background-color: #F17A28; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; margin-right: 12px;">Track Order</a>
          <a href="https://mehtadairy.com/reorder" style="display: inline-block; background-color: transparent; border: 2px solid #EAE3D2; color: #2C2C2C; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-weight: bold;">Buy Again</a>
        </div>
      </div>

      <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #888;">
        <p>Mehta Dairy | Serving sweetness since 1972</p>
        <p>If you have any questions, please reply to this email or contact our support team.</p>
      </div>
    </div>
  `;

  // 3. Send via Resend with Exponential Backoff Retries
  while (attempt <= maxRetries) {
    try {
      const { data, error } = await resend.emails.send({
        from: `Mehta Dairy <${SENDER_EMAIL}>`,
        to: email,
        bcc: "orders@mehtadairy.com",
        subject: `Your Invoice ${invoice.invoice_number} from Mehta Dairy`,
        html: htmlTemplate,
      });

      if (error) {
        throw new Error(error.message);
      }

      // Success: Save metadata back to the invoice's metadata JSONB column
      await updateInvoiceMetadata(invoiceId, {
        email_sent: true,
        sent_at: new Date().toISOString(),
        resend_message_id: data?.id,
        delivery_status: "sent"
      });

      return { success: true, message: "Invoice sent successfully!" };

    } catch (error: any) {
      attempt++;
      console.error(`Failed to send invoice ${invoice.invoice_number} (Attempt ${attempt}):`, error);
      
      if (attempt > maxRetries) {
        // Ultimate failure: Record failure in metadata
        await updateInvoiceMetadata(invoiceId, {
          email_sent: false,
          delivery_status: "failed",
          failed_reason: error.message
        });
        return { success: false, message: `Failed after ${maxRetries} attempts: ${error.message}` };
      }
      
      // Exponential backoff: 1s, 2s, 4s...
      const backoffMs = Math.pow(2, attempt - 1) * 1000;
      await delay(backoffMs);
    }
  }

  return { success: false, message: "Unknown error occurred" };
}

// Helper to safely update the metadata JSONB column without overwriting existing data
async function updateInvoiceMetadata(invoiceId: string, updates: Record<string, any>) {
  const { data: currentInvoice } = await supabase.from("invoices").select("metadata").eq("id", invoiceId).single();
  const currentMetadata = currentInvoice?.metadata || {};
  
  await supabase
    .from("invoices")
    .update({
      metadata: {
        ...currentMetadata,
        ...updates
      }
    })
    .eq("id", invoiceId);
}
