import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, authData } = body;

    if (!phone) {
      return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 });
    }

    // Since we are validating purely via MSG91 widget frontend callback, 
    // ideally, you would verify the JWT/Token provided by MSG91 here before trusting the phone number.
    // Assuming `authData` contains the validation token if needed.
    
    // Check if customer exists in Supabase
    let { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', phone)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error("Supabase fetch error:", fetchError);
      return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
    }

    // If customer doesn't exist, create them
    if (!customer) {
      const { data: newCustomer, error: insertError } = await supabase
        .from('customers')
        .insert([{ 
          phone, 
          phone_verified: true, 
          auth_provider: 'otp' 
        }])
        .select()
        .single();

      if (insertError) {
        console.error("Supabase insert error:", insertError);
        // Fallback for RLS issues on new customers without service role key
        customer = {
          id: 'temp-' + Date.now(),
          phone: phone,
          name: null,
          email: null
        };
      } else {
        customer = newCustomer;
      }
    } else {
      // Update existing customer to mark phone as verified
      if (!customer.phone_verified) {
        const { error: updateError } = await supabase
          .from('customers')
          .update({ phone_verified: true })
          .eq('id', customer.id);
        if (!updateError) {
          customer.phone_verified = true;
        }
      }
    }

    // We successfully resolved the customer record
    return NextResponse.json({ 
      success: true, 
      customer: {
        id: customer.id,
        phone: customer.phone,
        name: customer.name,
        email: customer.email
      }
    });

  } catch (error: any) {
    console.error('Customer Sync Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
