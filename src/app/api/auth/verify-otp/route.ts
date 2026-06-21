import { NextResponse } from 'next/server';

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY || '';

export async function POST(req: Request) {
  try {
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json({ success: false, error: 'Phone number and OTP are required' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const mobile = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    if (!MSG91_AUTH_KEY) {
      console.log(`[MSG91 Mock] Verifying OTP ${otp} for ${mobile}`);
      // Mock logic: 1234 is always successful in mock mode
      if (otp === '1234') {
        return NextResponse.json({ success: true, message: 'OTP verified (mock mode)' });
      }
      return NextResponse.json({ success: false, error: 'Invalid OTP' }, { status: 400 });
    }

    const url = `https://api.msg91.com/api/v5/otp/verify?otp=${otp}&mobile=${mobile}&authkey=${MSG91_AUTH_KEY}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.type === 'error' || data.type === 'error') { // MSG91 sometimes returns type: error
      return NextResponse.json({ success: false, error: data.message || 'Invalid OTP' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'OTP verified successfully' });

  } catch (error: any) {
    console.error('Verify OTP Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to verify OTP' }, { status: 500 });
  }
}
