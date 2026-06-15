import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const { phone, otp } = await request.json();

    if (!phone || !otp) {
      return NextResponse.json({ success: false, message: 'Phone and OTP are required' }, { status: 400 });
    }

    const authKey = process.env.MSG91_AUTH_KEY;

    let isOtpValid = false;

    // Simulated Fallback Mode
    const isSimulated = !authKey || 
                        authKey === 'your-msg91-auth-key-optional' || 
                        otp === '123456' || 
                        !process.env.MSG91_TEMPLATE_ID;

    if (isSimulated) {
      console.log(`[SIMULATED MSG91] Verifying OTP ${otp} for ${phone}`);
      // In simulated mode, let's accept "123456" as the valid OTP
      if (otp === '123456') {
        isOtpValid = true;
      } else {
         return NextResponse.json({ 
          success: false, 
          message: 'Invalid OTP (Simulated mode expects 123456)',
          type: 'error'
        }, { status: 400 });
      }
    } else {
      // Actual MSG91 Integration
      const url = `https://control.msg91.com/api/v5/otp/verify?otp=${otp}&mobile=91${phone}&authkey=${authKey}`;
      
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
      isOtpValid = true;
    }

    if (isOtpValid) {
      // Handle Supabase Profile
      // Check if user exists
      let { data: profile, error: fetchError } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 means zero rows found, which is fine
        console.error('Supabase fetch error:', fetchError);
      }

      if (!profile) {
        // Create new user profile
        const { data: newProfile, error: insertError } = await supabase
          .from('customers')
          .insert([
            { name: 'Customer', phone: phone, email: '' }
          ])
          .select()
          .single();
        
        if (insertError) {
          console.error('Supabase insert error:', insertError);
        } else {
          profile = newProfile;
        }
      }

      return NextResponse.json({ 
        success: true, 
        message: 'OTP verified successfully',
        profile 
      });
    }

  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
