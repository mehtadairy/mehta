import { getShiprocketToken } from './auth';
import { supabaseServer as supabase } from '@/lib/supabaseServer';

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
 * Checks pincode serviceability & retrieves courier prices and delivery ETAs from Shiprocket.
 */
export async function checkShiprocketServiceability(
  deliveryPincode: string,
  weightInKg: number = 0.5,
  isCod: boolean = false,
  subtotal: number = 0
): Promise<ServiceabilityResult> {
  const cleanPincode = (deliveryPincode || '').trim();
  const pickupPincode = process.env.SHIPROCKET_PICKUP_PINCODE || '396001';
  const actualWeight = Math.max(0.1, Number(weightInKg) || 0.5);

  if (!cleanPincode || cleanPincode.length < 6) {
    return {
      success: false,
      serviceable: false,
      pincode: cleanPincode,
      pickupPincode,
      weightInKg: actualWeight,
      deliveryCharge: 0,
      estimatedDeliveryTime: 'N/A',
      codAvailable: false,
      availableCouriers: [],
      error: 'Valid 6-digit Pincode is required'
    };
  }

  // 1. Get Auth Token
  const authRes = await getShiprocketToken();
  
  if (!authRes.success || authRes.isFallback || !authRes.token || authRes.token.startsWith('mock_') || authRes.token.startsWith('fallback_')) {
    console.log('[ShiprocketServiceability] Using rule-based fallback serviceability logic.');
    return getFallbackServiceability(cleanPincode, actualWeight, isCod, subtotal);
  }

  // 2. Query Shiprocket API
  try {
    const url = new URL(SHIPROCKET_SERVICEABILITY_URL);
    url.searchParams.append('pickup_postcode', pickupPincode);
    url.searchParams.append('delivery_postcode', cleanPincode);
    url.searchParams.append('weight', String(actualWeight));
    url.searchParams.append('cod', isCod ? '1' : '0');

    console.log(`[ShiprocketServiceability] Checking serviceability for pincode ${cleanPincode}, weight ${actualWeight}kg...`);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authRes.token}`
      },
      cache: 'no-store'
    });

    const data = await response.json();

    if (response.ok && data?.status === 200 && data?.data?.available_courier_companies?.length > 0) {
      const rawCouriers = data.data.available_courier_companies;

      const couriers: CourierOption[] = rawCouriers.map((c: any) => {
        // Calculate estimated delivery days
        const etdString = c.etd || c.estimated_delivery_days || '2-4 Days';
        let estimatedDays = 3;
        const daysMatch = String(etdString).match(/(\d+)/);
        if (daysMatch) {
          estimatedDays = parseInt(daysMatch[1], 10);
        }

        return {
          courierId: c.courier_company_id,
          courierName: c.courier_name,
          rate: Math.ceil(Number(c.rate || c.freight_charge || 50)),
          etd: etdString,
          estimatedDays: estimatedDays,
          rating: Number(c.rating || 4.2),
          codAvailable: Number(c.cod || 0) === 1 || c.cod_available === true
        };
      });

      // Filter available couriers if COD is requested
      const eligibleCouriers = isCod ? couriers.filter(c => c.codAvailable) : couriers;
      const processableCouriers = eligibleCouriers.length > 0 ? eligibleCouriers : couriers;

      // Sort for Cheapest, Fastest, and Recommended
      const sortedByPrice = [...processableCouriers].sort((a, b) => a.rate - b.rate);
      const sortedBySpeed = [...processableCouriers].sort((a, b) => a.estimatedDays - b.estimatedDays);
      
      // Recommended score = rating * 20 - price - (estimatedDays * 10)
      const sortedByRecommended = [...processableCouriers].sort((a, b) => {
        const scoreA = (a.rating * 25) - a.rate - (a.estimatedDays * 15);
        const scoreB = (b.rating * 25) - b.rate - (b.estimatedDays * 15);
        return scoreB - scoreA;
      });

      const cheapest = { ...sortedByPrice[0], isCheapest: true };
      const fastest = { ...sortedBySpeed[0], isFastest: true };
      const recommended = { ...sortedByRecommended[0], isRecommended: true };

      const finalCouriers = processableCouriers.map(c => ({
        ...c,
        isCheapest: c.courierId === cheapest.courierId,
        isFastest: c.courierId === fastest.courierId,
        isRecommended: c.courierId === recommended.courierId
      }));

      // Log successful lookup
      await supabase.from('shipping_logs').insert([{
        action: 'SERVICEABILITY_CHECK',
        request_payload: { pincode: cleanPincode, weight: actualWeight, isCod },
        response_payload: { count: finalCouriers.length, recommended: recommended.courierName, rate: recommended.rate },
        status: 'SUCCESS',
        created_at: new Date().toISOString()
      }]);

      return {
        success: true,
        serviceable: true,
        pincode: cleanPincode,
        pickupPincode,
        weightInKg: actualWeight,
        deliveryCharge: recommended.rate,
        estimatedDeliveryTime: recommended.etd,
        codAvailable: finalCouriers.some(c => c.codAvailable),
        cheapestCourier: cheapest,
        fastestCourier: fastest,
        recommendedCourier: recommended,
        availableCouriers: finalCouriers
      };
    } else {
      console.warn(`[ShiprocketServiceability] No couriers found for pincode ${cleanPincode}:`, data?.message || 'Unserviceable');
      return getFallbackServiceability(cleanPincode, actualWeight, isCod, subtotal);
    }
  } catch (err: any) {
    console.error('[ShiprocketServiceability] Error checking serviceability:', err);
    return getFallbackServiceability(cleanPincode, actualWeight, isCod, subtotal);
  }
}

/**
 * Fallback serviceability rule-based generator when API is unreachable or credentials are not configured.
 */
function getFallbackServiceability(
  pincode: string,
  weightInKg: number,
  isCod: boolean,
  subtotal: number
): ServiceabilityResult {
  const roundedWeight = Math.max(1, Math.ceil(weightInKg));
  const isGujarat = pincode.startsWith('36') || pincode.startsWith('37') || pincode.startsWith('38') || pincode.startsWith('39');
  
  let baseRate = isGujarat ? 40 : 70;
  let estTime = isGujarat ? '1-2 Days' : '2-4 Days';
  let totalCharge = roundedWeight * baseRate;

  if (pincode === '364270') {
    totalCharge = 0;
    estTime = 'Same Day / 1 Day';
  }

  const fallbackCouriers: CourierOption[] = [
    {
      courierId: 10,
      courierName: 'Delhivery Surface',
      rate: totalCharge,
      etd: estTime,
      estimatedDays: isGujarat ? 2 : 3,
      rating: 4.5,
      codAvailable: true,
      isRecommended: true
    },
    {
      courierId: 2,
      courierName: 'Bluedart Express',
      rate: totalCharge + 30,
      etd: isGujarat ? '1 Day' : '2 Days',
      estimatedDays: isGujarat ? 1 : 2,
      rating: 4.8,
      codAvailable: true,
      isFastest: true
    },
    {
      courierId: 5,
      courierName: 'Ecom Express',
      rate: Math.max(30, totalCharge - 10),
      etd: isGujarat ? '2 Days' : '4 Days',
      estimatedDays: isGujarat ? 2 : 4,
      rating: 4.1,
      codAvailable: true,
      isCheapest: true
    }
  ];

  return {
    success: true,
    serviceable: true,
    pincode,
    pickupPincode: process.env.SHIPROCKET_PICKUP_PINCODE || '396001',
    weightInKg,
    deliveryCharge: totalCharge,
    estimatedDeliveryTime: estTime,
    codAvailable: true,
    cheapestCourier: fallbackCouriers[2],
    fastestCourier: fallbackCouriers[1],
    recommendedCourier: fallbackCouriers[0],
    availableCouriers: fallbackCouriers,
    isFallback: true
  };
}
