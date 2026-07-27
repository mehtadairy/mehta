import { supabaseServer as supabase } from '@/lib/supabaseServer';

export class WhatsAppService {
  /**
   * Log the WhatsApp message to Supabase notification_logs
   */
  private static async logMessage(phone: string, eventName: string, templateName: string, payload: any, status: string = 'sent', errorMsg: string = '') {
    try {
      await supabase.from('notification_logs').insert([{
        phone,
        event_name: eventName,
        template_name: templateName,
        payload,
        status,
        error_message: errorMsg
      }]);
    } catch (error) {
      console.error('Failed to log WhatsApp message:', error);
    }
  }

  /**
   * Core function to send messages via official AiSensy Project API
   */
  private static async sendMessage(destination: string, payload: any, eventName: string, templateName: string) {
    const apiKey = process.env.AISENSY_PROJECT_API_KEY;
    const projectId = process.env.AISENSY_PROJECT_ID;
    const baseUrl = process.env.AISENSY_BASE_URL || 'https://apis.aisensy.com/project-apis/v1';

    const formattedDest = destination.replace(/\D/g, '');
    const to = formattedDest.length === 10 ? `91${formattedDest}` : formattedDest;

    if (!apiKey || !projectId) {
      console.warn('[WhatsAppService] AISENSY_PROJECT_API_KEY or AISENSY_PROJECT_ID is missing. Mocking WhatsApp message:', eventName, to);
      await this.logMessage(to, eventName, templateName, payload, 'mocked');
      return true;
    }

    try {
      const requestUrl = `${baseUrl}/project/${projectId}/messages`;
      
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-AiSensy-Project-API-Pwd': apiKey,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          ...payload
        }),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('[WhatsAppService] Error response from Project API:', responseData);
        await this.logMessage(to, eventName, templateName, payload, 'failed', responseData.message || 'WhatsApp API Error');
        return false;
      }

      await this.logMessage(to, eventName, templateName, payload, 'delivered');
      return true;
    } catch (error: any) {
      console.error(`[WhatsAppService] Error sending (${eventName}):`, error);
      await this.logMessage(to, eventName, templateName, payload, 'failed', error.message);
      return false;
    }
  }

  /**
   * Universal centralized Notification function.
   * This is fire-and-forget. It does not block execution.
   */
  static async sendNotification(eventName: string, phone: string, templateParams: string[] = [], mediaUrl?: string, filename?: string) {
    if (!phone) return false;

    // Run this asynchronously to not block checkout / API response
    (async () => {
      try {
        // 1. Fetch template mapping from database
        const { data: templateData, error } = await supabase
          .from('whatsapp_templates')
          .select('aisensy_name, is_active')
          .eq('event_name', eventName)
          .single();

        let aisensyName = eventName; // Fallback to eventName if DB not set up yet

        if (templateData) {
          if (!templateData.is_active) {
            console.log(`[WhatsAppService] Template for ${eventName} is disabled.`);
            return;
          }
          aisensyName = templateData.aisensy_name;
        }

        // 2. Prepare Payload
        const payload: any = {
          templateName: aisensyName,
        };

        if (templateParams.length > 0) {
          payload.templateParams = templateParams;
        }

        if (mediaUrl) {
          payload.media = {
            url: mediaUrl,
            filename: filename || 'Attachment'
          };
        }

        // 3. Send Message
        await this.sendMessage(phone, payload, eventName, aisensyName);
      } catch (err) {
        console.error(`[WhatsAppService] Exception in sendNotification background task for ${eventName}:`, err);
      }
    })();

    return true; // Always return true immediately to unblock the caller
  }

  // --------------------------------------------------------
  // Keep legacy wrappers for compatibility (OTP is critical)
  // --------------------------------------------------------

  static async sendOTP(phone: string, otp: string) {
    // We await this one specifically because OTP needs synchronous feedback sometimes, but fire-and-forget is also okay.
    // However, existing code might expect a Promise<boolean>. We will use the generic one synchronously for OTP just in case.
    const payload = {
      templateName: 'otp_verification',
      templateParams: [otp, "5"]
    };
    return this.sendMessage(phone, payload, 'otp', 'otp_verification');
  }

  // Wrappers to map legacy calls to the new system seamlessly:
  static async sendOrderConfirmation(phone: string, orderId: string, amount: number) {
    return this.sendNotification('order_confirmation', phone, [orderId, amount.toString()]);
  }

  static async sendPaymentReceived(phone: string, paymentId: string, amount: number) {
    return this.sendNotification('payment_success', phone, [paymentId, amount.toString()]);
  }

  static async sendInvoice(phone: string, orderId: string, invoiceUrl: string) {
    return this.sendNotification('invoice_generated', phone, [], invoiceUrl, `Invoice_${orderId}.pdf`);
  }

  static async sendPreparing(phone: string, orderId: string) {
    return this.sendNotification('status_preparing', phone, [orderId]);
  }

  static async sendPacked(phone: string, orderId: string) {
    return this.sendNotification('status_packed', phone, [orderId]);
  }

  static async sendOutForDelivery(phone: string, orderId: string, agentName: string, agentPhone: string) {
    return this.sendNotification('status_out_delivery', phone, [orderId, agentName, agentPhone]);
  }

  static async sendDelivered(phone: string, orderId: string) {
    return this.sendNotification('status_delivered', phone, [orderId]);
  }

  /**
   * Send Invoice Document PDF template using AiSensy
   */
  static async sendInvoiceDocument(
    destination: string,
    pdfUrl: string,
    orderNumber: string,
    invoiceNumber: string
  ): Promise<{ success: boolean; httpStatus: number; responseBody: any; messageId?: string; error?: string }> {
    const apiKey = process.env.AISENSY_PROJECT_API_KEY || process.env.API_CAMPAIGN_KEY;
    const projectId = process.env.AISENSY_PROJECT_ID;
    const campaignKey = process.env.API_CAMPAIGN_KEY || apiKey;

    const formattedDest = destination.replace(/\D/g, '');
    const to = formattedDest.length === 10 ? `91${formattedDest}` : formattedDest;
    const templateName = process.env.AISENSY_INVOICE_TEMPLATE_NAME || 'invoice_document';

    // 1. Fetch order details for template interpolation
    let customerName = 'Valued Customer';
    let totalAmount = '';
    try {
      const { data: order } = await supabase
        .from('orders')
        .select('user_name, total')
        .eq('order_number', orderNumber)
        .maybeSingle();
      
      if (order) {
        customerName = order.user_name || customerName;
        totalAmount = order.total ? `₹${order.total}` : '';
      }
    } catch (dbErr) {
      console.error('[WhatsAppService] Failed to retrieve order info for invoice template:', dbErr);
    }

    const payload = {
      templateName: templateName,
      templateParams: [customerName, invoiceNumber, orderNumber, totalAmount],
      media: {
        url: pdfUrl,
        filename: `Invoice_${orderNumber}.pdf`
      }
    };

    console.log("==================================================");
    console.log("[WhatsAppService] AUDIT LOG - WhatsApp Invoice Dispatch Attempt:");
    console.log(`  1. Target Raw Phone Number: ${destination}`);
    console.log(`  2. Formatted Phone Number sent to AiSensy: ${to}`);
    console.log(`  3. Template Name Being Used: ${templateName}`);
    console.log(`  8. Invoice PDF URL: ${pdfUrl}`);

    if (!apiKey) {
      console.warn('[WhatsAppService] AISENSY_PROJECT_API_KEY / API_CAMPAIGN_KEY is missing. Mocking Invoice WhatsApp message:', to);
      const mockMsgId = `mock-msg-${Math.random().toString(36).substring(2, 15)}`;
      await this.logMessage(to, 'invoice_document', templateName, payload, 'mocked');
      return { success: true, httpStatus: 200, responseBody: { mock: true, messageId: mockMsgId }, messageId: mockMsgId };
    }

    // Attempt 1: AiSensy Campaign API v2 (official endpoint used for transactional notifications)
    try {
      const campaignUrl = 'https://backend.aisensy.com/campaign/t1/api/v2';
      const campaignPayload = {
        apiKey: campaignKey,
        campaignName: templateName,
        destination: to,
        userName: customerName,
        templateParams: payload.templateParams,
        media: payload.media,
        source: "mehta-checkout"
      };

      console.log(`  5. Complete Request URL: ${campaignUrl}`);
      console.log(`  4. Complete Request Payload sent to AiSensy:`, JSON.stringify({ ...campaignPayload, apiKey: campaignKey ? campaignKey.substring(0, 8) + '***' : 'MISSING' }, null, 2));

      const response = await fetch(campaignUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignPayload)
      });

      const responseText = await response.text();
      let responseData: any = {};
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { raw: responseText };
      }

      console.log(`  6. HTTP Status Code: ${response.status}`);
      console.log(`  7. Complete AiSensy Response Body:`, JSON.stringify(responseData, null, 2));
      console.log("==================================================");

      if (response.ok && (responseData.success === true || responseData.status === 'success' || responseData.model === 'messages')) {
        const messageId = responseData.messageId || responseData.data?.messageId || `msg-${Date.now()}`;
        await this.logMessage(to, 'invoice_document', templateName, payload, 'delivered');
        return { success: true, httpStatus: response.status, responseBody: responseData, messageId };
      }

      console.warn(`[WhatsAppService] Campaign API v2 attempt returned non-OK (${response.status}). Trying Project API fallback...`);
    } catch (campaignErr: any) {
      console.error(`[WhatsAppService] Exception calling Campaign API v2:`, campaignErr);
    }

    // Attempt 2: Project API v1 Fallback
    try {
      const baseUrl = process.env.AISENSY_BASE_URL || 'https://apis.aisensy.com/project-apis/v1';
      const projectUrl = `${baseUrl}/project/${projectId}/messages`;

      console.log(`  5b. Fallback Request URL: ${projectUrl}`);
      const projectResponse = await fetch(projectUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-AiSensy-Project-API-Pwd': apiKey,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          ...payload
        }),
      });

      const projectText = await projectResponse.text();
      let projectData: any = {};
      try {
        projectData = JSON.parse(projectText);
      } catch (e) {
        projectData = { raw: projectText };
      }

      console.log(`  6b. Fallback HTTP Status Code: ${projectResponse.status}`);
      console.log(`  7b. Fallback AiSensy Response Body:`, JSON.stringify(projectData, null, 2));
      console.log("==================================================");

      if (!projectResponse.ok) {
        const errMsg = projectData.message || projectData.error?.message || projectText || 'WhatsApp API Error';
        await this.logMessage(to, 'invoice_document', templateName, payload, 'failed', errMsg);
        return { success: false, httpStatus: projectResponse.status, responseBody: projectData, error: errMsg };
      }

      const messageId = projectData.messageId || projectData.data?.messageId || `msg-${Date.now()}`;
      await this.logMessage(to, 'invoice_document', templateName, payload, 'delivered');
      return { success: true, httpStatus: projectResponse.status, responseBody: projectData, messageId };
    } catch (error: any) {
      console.error('[WhatsAppService] Exception sending invoice document:', error);
      await this.logMessage(to, 'invoice_document', templateName, payload, 'failed', error.message);
      return { success: false, httpStatus: 500, responseBody: { error: error.message }, error: error.message };
    }
  }
}
