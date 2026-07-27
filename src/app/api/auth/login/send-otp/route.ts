import { NextResponse } from 'next/server';
import { sendOTP } from '@/lib/services/whatsapp-auth';
import { supabaseServer as supabase } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return NextResponse.json({ success: false, error: 'Invalid phone number' }, { status: 400 });
    }

    // Login Flow Requirement: Check if customer exists BEFORE sending OTP
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching customer:', fetchError);
      return NextResponse.json({ success: false, error: `DB Error: ${fetchError.message}` }, { status: 500 });
    }

    if (!customer) {
      return NextResponse.json({ success: false, error: 'No account found. Please sign up first.' }, { status: 404 });
    }

    const result = await sendOTP(cleanPhone);

    if (result.success) {
      return NextResponse.json({ success: true, message: 'OTP sent successfully' });
    } else {
      return NextResponse.json({ success: false, error: result.error || 'Failed to send OTP' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Send OTP API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process OTP request' }, { status: 500 });
  }
}
