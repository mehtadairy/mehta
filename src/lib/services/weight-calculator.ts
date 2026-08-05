/**
 * Utility module for parsing product weights and calculating total cart weight in kilograms.
 */

/**
 * Parses item weight strings (e.g. "500g", "1kg", "250g", "2kg", "1.5kg", "250 gm", "750g") into numeric kilograms.
 */
export function parseWeightToKg(weightStr?: string): number {
  if (!weightStr) return 0.5;
  const clean = String(weightStr).trim().toLowerCase();

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
  if (!items || items.length === 0) return 0;

  let totalKg = 0;
  for (const item of items) {
    const unitKg = parseWeightToKg(item.weight || item.weightStr || item.unitWeight || item.selectedWeight);
    const qty = Number(item.quantity || item.qty) || 1;
    totalKg += unitKg * qty;
  }

  // Maintain precision in grams (e.g. 500g = 0.5kg, 1.25kg = 1.25kg)
  return Math.round(totalKg * 1000) / 1000;
}
