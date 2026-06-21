import { NextResponse } from 'next/server';

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY || '';
const MSG91_TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID || ''; // Optional: if using a specific template

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const mobile = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    if (!MSG91_AUTH_KEY) {
      console.log(`[MSG91 Mock] Sending OTP to ${mobile}`);
      return NextResponse.json({ success: true, message: 'OTP sent (mock mode)', reqId: `mock_${Date.now()}` });
    }

    const url = `https://api.msg91.com/api/v5/otp?template_id=${MSG91_TEMPLATE_ID}&mobile=${mobile}&authkey=${MSG91_AUTH_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.type === 'error') {
      throw new Error(data.message);
    }

    return NextResponse.json({ success: true, message: 'OTP sent successfully', reqId: data.request_id });

  } catch (error: any) {
    console.error('Send OTP Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to send OTP' }, { status: 500 });
  }
}
