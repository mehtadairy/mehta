import { getShippingSettings, calculateSlabShipping, ShippingCalculationResult } from './shipping-calculator';

export interface DeliveryCalculationResult {
  success: boolean;
  error?: string;
  city?: string;
  deliveryCharge: number;
  ratePerKg?: number;
  weightInKg?: number;
  chargeableWeightKg?: number;
  estimatedDeliveryTime?: string;
  freeDeliveryEligible: boolean;
  zone?: string;
}

/**
 * Calculates delivery charges based on destination and cart weight in started KG.
 */
export async function calculateDeliveryCharge(
  pincode: string,
  state: string = '',
  cartItems: any[] = []
): Promise<DeliveryCalculationResult> {
  const cleanPincode = (pincode || '').trim();

  try {
    const settings = await getShippingSettings();
    const result: ShippingCalculationResult = calculateSlabShipping(
      cartItems,
      { pincode: cleanPincode, state },
      settings
    );

    return {
      success: true,
      city: `${result.zone} Delivery`,
      deliveryCharge: result.totalShippingCharge,
      ratePerKg: result.ratePerKg,
      weightInKg: result.totalWeightKg,
      chargeableWeightKg: result.chargeableWeightKg,
      estimatedDeliveryTime: result.estimatedDeliveryTime,
      freeDeliveryEligible: false,
      zone: result.zone,
    };
  } catch (err: any) {
    console.error('[DeliveryService] Error computing delivery charge:', err);
    return {
      success: false,
      error: err.message || 'Failed to calculate delivery charge',
      deliveryCharge: 40,
      freeDeliveryEligible: false
    };
  }
}
