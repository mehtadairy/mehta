import { SupabaseClient } from '@supabase/supabase-js';

export async function generateOrderNumber(supabase: SupabaseClient): Promise<string> {
  let orderNumber: string | null = null;
  
  try {
    const { data: newOrd, error: rpcError } = await supabase.rpc('get_next_order_number');
    if (!rpcError && newOrd) {
      orderNumber = newOrd;
    } else if (rpcError) {
      console.warn("[generateOrderNumber] RPC get_next_order_number failed or unavailable:", rpcError.message);
    }
  } catch (e) {
    console.warn("[generateOrderNumber] Error calling RPC:", e);
  }

  // Fallback to random generator if RPC fails or is missing
  if (!orderNumber) {
    const now = new Date();
    const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
    const randDigits = Math.floor(1000 + Math.random() * 9000);
    orderNumber = `MD-${dateStr}-${randDigits}`;
  }

  return orderNumber;
}
