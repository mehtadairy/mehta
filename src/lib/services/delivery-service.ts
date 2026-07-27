import { supabaseServer as supabase } from '@/lib/supabaseServer';

export interface DeliveryCalculationResult {
  success: boolean;
  error?: string;
  city?: string;
  deliveryCharge: number;
  ratePerKg?: number;
  weightInKg?: number;
  estimatedDeliveryTime?: string;
  freeDeliveryEligible: boolean;
}

/**
 * Calculates delivery charges based on destination region & weight:
 * - Free Delivery (₹0): Pincode 364270
 * - Gujarat (pincodes 36xxxx-39xxxx): ₹40 per kg
 * - Out of State / All Other Pincodes (Mumbai, Rest of India): ₹70 per kg
 * - Allows ALL pincodes across India
 */
export async function calculateDeliveryCharge(
  pincode: string,
  subtotal: number = 0,
  weightInKg: number = 1
): Promise<DeliveryCalculationResult> {
  const cleanPincode = (pincode || '').trim();
  if (!cleanPincode) {
    return { success: false, error: 'Pincode is required', deliveryCharge: 0, freeDeliveryEligible: false };
  }

  // Minimum 1kg charging base (fractions of kg rounded up to next full kg)
  const actualWeight = Math.max(0.1, Number(weightInKg) || 1);
  const roundedWeightInKg = Math.max(1, Math.ceil(actualWeight));

  // SPECIAL EXEMPTION: Free delivery for pincode 364270
  if (cleanPincode === '364270') {
    return {
      success: true,
      city: 'Local Area (Free Delivery)',
      deliveryCharge: 0,
      ratePerKg: 0,
      weightInKg: actualWeight,
      estimatedDeliveryTime: 'Same Day / 1 Day',
      freeDeliveryEligible: true
    };
  }

  // Fetch delivery zones from DB if available for custom free delivery thresholds or names
  let zones: any[] = [];
  try {
    const { data } = await supabase.from('delivery_zones').select('*');
    if (data) zones = data;
  } catch (err) {
    console.error('Error fetching delivery zones from DB:', err);
  }

  // Check matching zone in DB
  const matchedZone = zones.find((zone: any) => {
    const pincodesStr = zone.pincodes || zone.pincode || '';
    const pincodesArr = pincodesStr.split(',').map((p: string) => p.trim());
    return pincodesArr.includes(cleanPincode);
  });

  // Check if pincode belongs to Gujarat (36xxxx, 37xxxx, 38xxxx, 39xxxx)
  const isGujarat = cleanPincode.startsWith('36') || cleanPincode.startsWith('37') ||
    cleanPincode.startsWith('38') || cleanPincode.startsWith('39') ||
    matchedZone?.state?.toLowerCase().includes('gujarat') ||
    matchedZone?.name?.toLowerCase().includes('gujarat');

  let ratePerKg = 70; // Default Out-of-State / Rest of India rate: ₹70/kg
  let regionName = 'Out of State';
  let estTime = '2-4 Days';

  if (isGujarat) {
    ratePerKg = 40; // Inside Gujarat rate: ₹40/kg
    regionName = 'Gujarat';
    estTime = '1-2 Days';
  } else if (cleanPincode.startsWith('400') || matchedZone?.city?.toLowerCase().includes('mumbai')) {
    ratePerKg = 70; // Mumbai: ₹70/kg
    regionName = 'Mumbai';
    estTime = '2-3 Days';
  } else if (matchedZone) {
    ratePerKg = Number(matchedZone.delivery_charge_per_kg || matchedZone.delivery_charge || 70);
    regionName = matchedZone.name || matchedZone.city || 'Out of State';
    estTime = matchedZone.estimated_delivery_time || '2-4 Days';
  }

  let deliveryCharge = roundedWeightInKg * ratePerKg;

  // Free delivery check if specified in zone
  const freeThreshold = matchedZone?.free_delivery_above ? Number(matchedZone.free_delivery_above) : null;
  const freeDeliveryEligible = freeThreshold !== null && subtotal >= freeThreshold;

  if (freeDeliveryEligible) {
    deliveryCharge = 0;
  }

  return {
    success: true,
    city: regionName,
    deliveryCharge,
    ratePerKg,
    weightInKg: actualWeight,
    estimatedDeliveryTime: estTime,
    freeDeliveryEligible
  };
}
