export class OTPWidget {
  private static widgetId: string = "";
  private static tokenAuth: string = "";

  private static checkInitialization() {
    if (this.widgetId === "" || this.tokenAuth === "") {
      console.warn("OTPWidget: Call initializeWidget before using send/verify/retry.");
      return false;
    }
    return true;
  }

  /**
   * Initializes the widget with necessary authentication details.
   */
  static initializeWidget(widgetId: string | number, tokenAuth: string) {
    this.widgetId = String(widgetId);
    this.tokenAuth = tokenAuth;
  }

  /**
   * Sends an OTP to the identifier (phone or email).
   */
  static async sendOTP(body: { identifier: string; [key: string]: any }) {
    if (!this.checkInitialization()) {
      throw new Error("OTPWidget not initialized. Please configure MSG91 Widget ID and Token.");
    }

    const payload = {
      widgetId: this.widgetId,
      tokenAuth: this.tokenAuth,
      ...body
    };

    const res = await fetch('https://control.msg91.com/api/v5/widget/sendOtp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.type === 'error') {
      throw new Error(data.message || 'Failed to send OTP');
    }
    return data;
  }

  /**
   * Verifies the user-entered OTP.
   */
  static async verifyOTP(body: { otp: string; reqId: string; [key: string]: any }) {
    if (!this.checkInitialization()) {
      throw new Error("OTPWidget not initialized. Please configure MSG91 Widget ID and Token.");
    }

    const payload = {
      widgetId: this.widgetId,
      tokenAuth: this.tokenAuth,
      ...body
    };

    const res = await fetch('https://control.msg91.com/api/v5/widget/verifyOtp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.type === 'error') {
      throw new Error(data.message || 'Invalid OTP');
    }
    return data;
  }

  /**
   * Retries sending the OTP.
   */
  static async retryOTP(body: { reqId: string; retryChannel?: string | number; [key: string]: any }) {
    if (!this.checkInitialization()) {
      throw new Error("OTPWidget not initialized. Please configure MSG91 Widget ID and Token.");
    }

    const payload = {
      widgetId: this.widgetId,
      tokenAuth: this.tokenAuth,
      ...body
    };

    const res = await fetch('https://control.msg91.com/api/v5/widget/retryOtp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.type === 'error') {
      throw new Error(data.message || 'Failed to resend OTP');
    }
    return data;
  }
}

// Bind to window for global access/compatibility in standard script environments
if (typeof window !== 'undefined') {
  (window as any).OTPWidget = OTPWidget;
}
