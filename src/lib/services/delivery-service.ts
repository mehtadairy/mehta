import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { checkShiprocketServiceability } from '@/lib/services/shiprocket/serviceability';

export interface DeliveryCalculationResult {
  success: boolean;
  error?: string;
  city?: string;
  deliveryCharge: number;
  ratePerKg?: number;
  weightInKg?: number;
  estimatedDeliveryTime?: string;
  freeDeliveryEligible: boolean;
  courierName?: string;
}

/**
 * Calculates delivery charges strictly based on Shiprocket API real-time serviceability & rate APIs:
 * - Free Local Delivery (₹0): Pincode 364270
 * - Real-Time Shiprocket Courier Rate API for all other India pincodes
 */
export async function calculateDeliveryCharge(
  pincode: string,
  subtotal: number = 0,
  weightInKg: number = 1
): Promise<DeliveryCalculationResult> {
  const cleanPincode = (pincode || '').trim();
  if (!cleanPincode || cleanPincode.length < 6) {
    return { success: false, error: 'Valid 6-digit Pincode is required', deliveryCharge: 0, freeDeliveryEligible: false };
  }

  const actualWeight = Math.max(0.1, Number(weightInKg) || 1);

  // SPECIAL EXEMPTION: Free delivery for local store pincode 364270
  if (cleanPincode === '364270') {
    return {
      success: true,
      city: 'Local Store Area (Free Delivery)',
      deliveryCharge: 0,
      ratePerKg: 0,
      weightInKg: actualWeight,
      estimatedDeliveryTime: 'Same Day / 1 Day',
      freeDeliveryEligible: true
    };
  }

  // 1. Fetch Real-Time Shipping Rate directly from Shiprocket API
  try {
    const srResult = await checkShiprocketServiceability(cleanPincode, actualWeight, false, subtotal);

    if (srResult.success && srResult.serviceable) {
      let finalCharge = srResult.deliveryCharge;
      
      // Check if DB custom free delivery threshold applies
      const { data: zones } = await supabase.from('delivery_zones').select('*');
      const matchedZone = (zones || []).find((zone: any) => {
        const pincodesStr = zone.pincodes || zone.pincode || '';
        return pincodesStr.split(',').map((p: string) => p.trim()).includes(cleanPincode);
      });

      const freeThreshold = matchedZone?.free_delivery_above ? Number(matchedZone.free_delivery_above) : null;
      const freeDeliveryEligible = freeThreshold !== null && subtotal >= freeThreshold;

      if (freeDeliveryEligible) {
        finalCharge = 0;
      }

      return {
        success: true,
        city: srResult.recommendedCourier?.courierName ? `Shiprocket (${srResult.recommendedCourier.courierName})` : 'Serviceable via Shiprocket',
        deliveryCharge: Math.round(finalCharge),
        weightInKg: actualWeight,
        estimatedDeliveryTime: srResult.estimatedDeliveryTime || '2-4 Days',
        freeDeliveryEligible,
        courierName: srResult.recommendedCourier?.courierName || 'Courier Partner'
      };
    }
  } catch (err) {
    console.warn('[DeliveryService] Shiprocket API lookup failed, evaluating fallback calculation:', err);
  }

  // Fallback calculation if Shiprocket API is unconfigured/down
  const isGujarat = cleanPincode.startsWith('36') || cleanPincode.startsWith('37') ||
    cleanPincode.startsWith('38') || cleanPincode.startsWith('39');

  const ratePerKg = isGujarat ? 40 : 70;
  const deliveryCharge = Math.ceil(actualWeight) * ratePerKg;

  return {
    success: true,
    city: isGujarat ? 'Gujarat Delivery' : 'Rest of India Delivery',
    deliveryCharge,
    ratePerKg,
    weightInKg: actualWeight,
    estimatedDeliveryTime: isGujarat ? '1-2 Days' : '2-4 Days',
    freeDeliveryEligible: false
  };
}
