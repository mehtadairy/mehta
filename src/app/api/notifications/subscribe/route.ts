import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { cookies } from 'next/headers';
import { verifyCustomerSession } from '@/lib/auth-utils';

export async function POST(req: Request) {
  try {
    const { subscription, location } = await req.json();

    if (!subscription) {
      return NextResponse.json({ success: false, error: 'Subscription required' }, { status: 400 });
    }

    // Get customer ID from verified JWT cookie to prevent hijack / unauthorized updates
    const cookieStore = await cookies();
    const token = cookieStore.get('mehta_customer_token')?.value;
    let customerId = null;

    if (token) {
      const payload = await verifyCustomerSession(token);
      if (payload?.id) {
        customerId = payload.id;
      }
    }

    if (!customerId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { error: updateError } = await supabase
      .from('customers')
      .update({
        push_subscription: subscription,
        ...(location && { location: location })
      })
      .eq('id', customerId);

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
