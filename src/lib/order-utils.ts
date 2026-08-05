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

/**
 * Parses item weight strings (e.g. "500g", "1kg", "250g", "2kg", "1.5kg", "250 gm") into numeric kilograms.
 */
export function parseWeightToKg(weightStr?: string): number {
  if (!weightStr) return 0.5;
  const clean = weightStr.trim().toLowerCase();

  if (clean.includes('kg')) {
    const num = parseFloat(clean.replace('kg', '').trim());
    return isNaN(num) || num <= 0 ? 1.0 : num;
  }
  if (clean.includes('g') || clean.includes('gm')) {
    const num = parseFloat(clean.replace(/[^\d.]/g, '').trim());
    return isNaN(num) || num <= 0 ? 0.5 : num / 1000;
  }
  const rawNum = parseFloat(clean);
  if (!isNaN(rawNum) && rawNum > 0) {
    return rawNum > 10 ? rawNum / 1000 : rawNum;
  }
  return 0.5;
}

/**
 * Calculates total weight of order/cart items in kilograms.
 * Automatically handles item quantity multipliers.
 */
export function calculateCartTotalWeight(items: any[] = []): number {
  if (!items || items.length === 0) return 0.5;

  let totalKg = 0;
  for (const item of items) {
    const unitKg = parseWeightToKg(item.weight || item.weightStr || item.unitWeight);
    const qty = Number(item.quantity || item.qty) || 1;
    totalKg += unitKg * qty;
  }

  // Maintain precision in grams (e.g. 501g = 0.501kg)
  return Math.max(0.001, Math.round(totalKg * 1000) / 1000);
}
