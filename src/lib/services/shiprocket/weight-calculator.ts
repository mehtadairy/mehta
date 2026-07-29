/**
 /**
  * Utility module for calculating accurate order weights & package dimensions
  * for Shiprocket Rate Serviceability & Shipment Creation APIs.
  */

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

  // Ensure minimum weight of 0.5kg for shipping calculations
  return Math.max(0.5, Math.round(totalKg * 100) / 100);
}

/**
 * Computes dynamic package dimensions (Length x Breadth x Height in cm)
 * based on total shipment weight in kg.
 */
export function calculatePackageDimensions(totalWeightKg: number): {
  length: number;
  breadth: number;
  height: number;
  volumetricWeightKg: number;
} {
  const weight = Math.max(0.5, Number(totalWeightKg) || 0.5);

  // Standard box size for <= 1kg: 15 x 15 x 10 cm (Volumetric: 0.45 kg)
  if (weight <= 1.0) {
    return {
      length: 15,
      breadth: 15,
      height: 10,
      volumetricWeightKg: 0.45
    };
  }

  // Proportional cubic box scaling for larger weights
  // Formula: L = B = Math.max(15, round(15 * weight^0.33)), H = Math.max(10, round(10 * weight^0.33))
  const scaleFactor = Math.pow(weight, 0.35);
  const length = Math.max(15, Math.round(15 * scaleFactor));
  const breadth = Math.max(15, Math.round(15 * scaleFactor));
  const height = Math.max(10, Math.round(10 * scaleFactor));

  // Volumetric weight = (L * B * H) / 5000
  const volumetricWeightKg = Math.round(((length * breadth * height) / 5000) * 100) / 100;

  return {
    length,
    breadth,
    height,
    volumetricWeightKg
  };
}
