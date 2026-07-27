import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { WhatsAppService } from '@/lib/services/whatsapp';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export async function POST(request: Request) {
  try {
    const { cancellationId, action } = await request.json();

    if (!cancellationId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // 1. Fetch Cancellation Record
    const { data: cancellation, error: fetchErr } = await supabase
      .from('order_cancellations')
      .select('*, orders(*)')
      .eq('id', cancellationId)
      .single();

    if (fetchErr || !cancellation) {
      return NextResponse.json({ error: 'Cancellation request not found' }, { status: 404 });
    }

    const order = cancellation.orders;
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    if (cancellation.refund_status !== 'Requested') {
      return NextResponse.json({ error: 'Refund is not in Requested state' }, { status: 400 });
    }

    if (action === 'approve') {
      // 2. Process Razorpay Refund
      if (order.payment_id && order.payment_id.startsWith('pay_')) {
         try {
           await razorpay.payments.refund(order.payment_id, {
             amount: Math.round(order.total * 100),
             notes: {
               order_id: order.id,
               cancellation_id: cancellation.id
             }
           });
         } catch(rzpErr: any) {
           console.error("Razorpay Refund Error:", rzpErr);
           return NextResponse.json({ error: 'Razorpay Refund Failed', details: rzpErr.error?.description || rzpErr.message }, { status: 500 });
         }
      } else {
         console.warn(`Payment ID ${order.payment_id} does not look like a valid Razorpay ID. Marking as completed anyway for manual offline refund.`);
      }

      // 3. Update Statuses to Refund Initiated
      await supabase.from('order_cancellations').update({ refund_status: 'Initiated' }).eq('id', cancellationId);
      
      await supabase.from('orders').update({
        status: 'Cancelled',
        payment_status: 'Refund Initiated'
      }).eq('id', order.id);

      return NextResponse.json({ success: true, message: 'Refund approved and initiated' });

    } else if (action === 'reject') {
      
      // Update Statuses
      await supabase.from('order_cancellations').update({ refund_status: 'Rejected' }).eq('id', cancellationId);
      
      await supabase.from('orders').update({
        payment_status: 'Refund Rejected'
      }).eq('id', order.id);

      return NextResponse.json({ success: true, message: 'Refund rejected' });
    }

  } catch (error: any) {
    console.error('Admin Refund API Error:', error);
    return NextResponse.json({ error: 'Failed to process refund action' }, { status: 500 });
  }
}
