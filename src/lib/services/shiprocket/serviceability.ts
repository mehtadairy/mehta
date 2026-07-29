import { getShiprocketToken } from './auth';
import { supabaseServer as supabase } from '@/lib/supabaseServer';

import { calculatePackageDimensions } from './weight-calculator';

const SHIPROCKET_SERVICEABILITY_URL = 'https://apiv2.shiprocket.in/v1/external/courier/serviceability/';

export interface CourierOption {
  courierId: number;
  courierName: string;
  rate: number;
  etd: string;
  etdHours?: number;
  estimatedDays: number;
  rating: number;
  codAvailable: boolean;
  isCheapest?: boolean;
  isFastest?: boolean;
  isRecommended?: boolean;
}

export interface ServiceabilityResult {
  success: boolean;
  serviceable: boolean;
  pincode: string;
  pickupPincode: string;
  weightInKg: number;
  length?: number;
  breadth?: number;
  height?: number;
  declaredValue?: number;
  deliveryCharge: number;
  estimatedDeliveryTime: string;
  codAvailable: boolean;
  cheapestCourier?: CourierOption;
  fastestCourier?: CourierOption;
  recommendedCourier?: CourierOption;
  availableCouriers: CourierOption[];
  isFallback?: boolean;
  error?: string;
}

/**
 * Calculates custom rule-based delivery charge:
 * - Local Palitana (364270): Free (₹0)
 * - Gujarat (Pincodes 36, 37, 38, 39): ₹40 / kg
 * - South India (Pincodes 50-69): ₹80 / kg
 * - Out of Gujarat / Rest of India: ₹70 / kg
 */
export function calculateCustomDeliveryRate(
  pincode: string,
  weightInKg: number
): { rate: number; estTime: string; zone: 'Gujarat' | 'South India' | 'Rest of India' | 'Local' } {
  const cleanPin = (pincode || '').trim();
  const roundedWeight = Math.max(1, Math.ceil(Number(weightInKg) || 0.5));

  // Local Store Pickup / Free Delivery Zone
  if (cleanPin === '364270') {
    return { rate: 0, estTime: 'Same Day / 1 Day', zone: 'Local' };
  }

  // Gujarat Pincodes (36xxx, 37xxx, 38xxx, 39xxx)
  const isGujarat = cleanPin.startsWith('36') || cleanPin.startsWith('37') || cleanPin.startsWith('38') || cleanPin.startsWith('39');
  if (isGujarat) {
    return { rate: roundedWeight * 40, estTime: '1-2 Days', zone: 'Gujarat' };
  }

  // South India Pincodes (50xxx to 69xxx: Telangana, Andhra Pradesh, Karnataka, Tamil Nadu, Kerala, Puducherry)
  const prefix2 = parseInt(cleanPin.slice(0, 2), 10);
  const isSouthIndia = !isNaN(prefix2) && prefix2 >= 50 && prefix2 <= 69;
  if (isSouthIndia) {
    return { rate: roundedWeight * 80, estTime: '3-5 Days', zone: 'South India' };
  }

  // Out of Gujarat / Rest of India
  return { rate: roundedWeight * 70, estTime: '2-4 Days', zone: 'Rest of India' };
}

/**
 * Checks pincode serviceability & returns delivery rate.
 * Uses custom per-kg rate pricing (Gujarat: ₹40/kg, South: ₹80/kg, Rest of India: ₹70/kg).
 */
export async function checkShiprocketServiceability(
  deliveryPincode: string,
  weightInKg: number = 0.5,
  isCod: boolean = false,
  subtotal: number = 0,
  customLength?: number,
  customBreadth?: number,
  customHeight?: number
): Promise<ServiceabilityResult> {
  const cleanPincode = (deliveryPincode || '').trim();
  const pickupPincode = process.env.SHIPROCKET_PICKUP_PINCODE || '396001';
  const actualWeight = Math.max(0.1, Number(weightInKg) || 0.5);
  const declaredValue = Math.max(0, Number(subtotal) || 0);

  const dims = calculatePackageDimensions(actualWeight);
  const length = customLength || dims.length;
  const breadth = customBreadth || dims.breadth;
  const height = customHeight || dims.height;

  if (!cleanPincode || cleanPincode.length < 6) {
    return {
      success: false,
      serviceable: false,
      pincode: cleanPincode,
      pickupPincode,
      weightInKg: actualWeight,
      length,
      breadth,
      height,
      declaredValue,
      deliveryCharge: 0,
      estimatedDeliveryTime: 'N/A',
      codAvailable: false,
      availableCouriers: [],
      error: 'Valid 6-digit Pincode is required'
    };
  }

  // Use Custom Per-Kg Rates as requested
  const customRate = calculateCustomDeliveryRate(cleanPincode, actualWeight);
  console.log(`[DeliveryServiceability] Calculated Custom Rate for Pincode ${cleanPincode} (${customRate.zone}): Weight ${actualWeight}kg = ₹${customRate.rate}`);

  const primaryCourier: CourierOption = {
    courierId: 10,
    courierName: 'Express Express Delivery',
    rate: customRate.rate,
    etd: customRate.estTime,
    estimatedDays: customRate.zone === 'Gujarat' ? 2 : 4,
    rating: 4.8,
    codAvailable: true,
    isRecommended: true,
    isCheapest: true
  };

  // Log calculation to database
  try {
    await supabase.from('shipping_logs').insert([{
      action: 'SERVICEABILITY_CHECK',
      request_payload: { pincode: cleanPincode, weight: actualWeight, isCod, zone: customRate.zone },
      response_payload: { rate: customRate.rate, estTime: customRate.estTime },
      status: 'SUCCESS',
      created_at: new Date().toISOString()
    }]);
  } catch (e) {
    console.warn("[DeliveryServiceability] Non-fatal log notice:", e);
  }

  return {
    success: true,
    serviceable: true,
    pincode: cleanPincode,
    pickupPincode,
    weightInKg: actualWeight,
    length,
    breadth,
    height,
    declaredValue,
    deliveryCharge: customRate.rate,
    estimatedDeliveryTime: customRate.estTime,
    codAvailable: true,
    cheapestCourier: primaryCourier,
    fastestCourier: primaryCourier,
    recommendedCourier: primaryCourier,
    availableCouriers: [primaryCourier],
    isFallback: false
  };
}
