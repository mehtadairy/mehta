import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { WhatsAppService } from '@/lib/services/whatsapp';
import { generateOrderNumber } from '@/lib/order-utils';

export async function GET(request: Request) {
  // Validate Cron Secret
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 0. Delete Draft Orders older than 30 minutes
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { error: draftDelErr } = await supabase
      .from('orders')
      .delete()
      .eq('status', 'Draft')
      .lt('created_at', thirtyMinsAgo);
    
    if (draftDelErr) {
      console.error("[PaymentRecoveryWorker] Failed to delete expired drafts:", draftDelErr.message);
    } else {
      console.log("[PaymentRecoveryWorker] Successfully cleaned up expired drafts.");
    }

    const { data: pendingRecoveries, error: fetchError } = await supabase
      .from('payment_recovery')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10);

    if (fetchError) throw fetchError;
    
    if (!pendingRecoveries || pendingRecoveries.length === 0) {
      return NextResponse.json({ status: 'ok', message: 'No pending recoveries' });
    }

    console.log(`[PaymentRecoveryWorker] Found ${pendingRecoveries.length} pending payments to recover.`);

    const results = [];

    for (const recovery of pendingRecoveries) {
      try {
        console.log(`[PaymentRecoveryWorker] Attempting recovery for Payment ${recovery.payment_id}`);
        
        // 1. Generate Order Number
        const generatedOrderNumber = await generateOrderNumber(supabase);

        // 2. Prepare Order Payload
        // recovery.payload contains the webhook payload or similar. Wait, the webhook doesn't have the cart items.
        // Wait, the order is likely ALREADY in the database as 'Pending' if `create-order` succeeded!
        // We just need to update it!
        let orderToUpdate = null;
        if (recovery.razorpay_order_id) {
          const { data } = await supabase.from('orders').select('*').eq('id', recovery.razorpay_order_id).maybeSingle();
          orderToUpdate = data;
        }

        if (!orderToUpdate) {
           // We might not have the order if `create-order` failed completely and then user paid on an old razorpay window?
           // In this case, we need admin manual intervention.
           await supabase.from('payment_recovery').update({ 
             status: 'failed', 
             failure_reason: 'Draft order not found in DB. Manual intervention required.',
             retry_count: (recovery.retry_count || 0) + 1
           }).eq('id', recovery.id);
           results.push({ id: recovery.id, status: 'failed', reason: 'Draft order not found' });
           continue;
        }

        // Update the Draft order to Paid
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            order_number: generatedOrderNumber,
            payment_status: 'Paid',
            status: 'Processing',
            payment_completed_at: new Date().toISOString(),
            payment_id: recovery.payment_id,
            payment_method: 'Razorpay'
          })
          .eq('id', orderToUpdate.id);

        if (updateError) throw updateError;

        // Mark recovery as successful
        await supabase.from('payment_recovery').update({ 
          status: 'recovered', 
          updated_at: new Date().toISOString() 
        }).eq('id', recovery.id);

        // Notify Admin / WhatsApp
        const cleanPhone = orderToUpdate.user_phone ? `91${orderToUpdate.user_phone.replace(/\D/g, '').slice(-10)}` : '';
        if (cleanPhone) {
           try {
             await WhatsAppService.sendPaymentReceived(cleanPhone, recovery.payment_id, recovery.amount / 100);
             await WhatsAppService.sendOrderConfirmation(cleanPhone, generatedOrderNumber, recovery.amount / 100);
           } catch(e) {}
        }
        
        try {
          const adminTitle = "🟢 Recovered Paid Order";
          const adminMsg = `${generatedOrderNumber} - ₹${orderToUpdate.total} - ${orderToUpdate.user_name || 'Customer'}`;
          await supabase.from('notifications').insert([{
            title: adminTitle,
            message: adminMsg,
            type: 'admin',
            order_id: orderToUpdate.id
          }]);
        } catch(e) {}

        results.push({ id: recovery.id, status: 'recovered', order_number: generatedOrderNumber });

      } catch (err: any) {
        console.error(`[PaymentRecoveryWorker] Failed to recover ${recovery.id}:`, err);
        await supabase.from('payment_recovery').update({
          retry_count: (recovery.retry_count || 0) + 1,
          failure_reason: err.message || 'Unknown error'
        }).eq('id', recovery.id);
        
        results.push({ id: recovery.id, status: 'retry_failed', reason: err.message });
      }
    }

    return NextResponse.json({ status: 'ok', processed: results.length, results });

  } catch (error: any) {
    console.error('Payment Recovery Worker Error:', error);
    return NextResponse.json({ error: 'Worker failed', details: error.message }, { status: 500 });
  }
}
