import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
  try {
    const { subscription, location, phone } = await req.json();

    if (!subscription || !phone) {
      return NextResponse.json({ success: false, error: 'Subscription and phone required' }, { status: 400 });
    }

    // Since customers might not have an active session context if they login via OTP
    // we use their verified phone number to find the record and update it.
    
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', phone)
      .single();

    if (fetchError || !customer) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from('customers')
      .update({
        push_subscription: subscription,
        ...(location && { location: location })
      })
      .eq('id', customer.id);

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return NextResponse.json({ success: false, error: 'Failed to save subscription' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Subscribe Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
