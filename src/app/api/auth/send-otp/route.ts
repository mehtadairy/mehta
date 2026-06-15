import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ success: false, message: 'Phone number is required' }, { status: 400 });
    }

    const authKey = process.env.MSG91_AUTH_KEY;
    const templateId = process.env.MSG91_TEMPLATE_ID;

    // Simulated Fallback Mode
    if (!authKey || authKey === 'your-msg91-auth-key-optional' || !templateId) {
      console.log(`[SIMULATED MSG91] Sending OTP to ${phone}`);
      return NextResponse.json({ 
        success: true, 
        message: 'OTP sent successfully (Simulated)',
        type: 'success'
      });
    }

    // Actual MSG91 Integration
    const url = `https://control.msg91.com/api/v5/otp?template_id=${templateId}&mobile=91${phone}&authkey=${authKey}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (data.type === 'error') {
      return NextResponse.json({ success: false, message: data.message }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'OTP sent successfully',
      data 
    });

  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
