import { supabase } from '../supabaseClient';
import { calculateCartTotalWeight } from './weight-calculator';

export interface ShippingSettings {
  id?: string;
  gujarat_rate_per_kg: number;
  outside_gujarat_rate_per_kg: number;
  south_india_rate_per_kg: number;
  updated_at?: string;
}

export const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  gujarat_rate_per_kg: 40,
  outside_gujarat_rate_per_kg: 70,
  south_india_rate_per_kg: 80,
};

export const SOUTH_INDIA_STATES = [
  'tamil nadu',
  'kerala',
  'karnataka',
  'andhra pradesh',
  'telangana',
  'puducherry'
];

// In-memory cache for shipping settings (5-minute TTL)
let _cachedSettings: ShippingSettings | null = null;
let _cacheExpiry = 0;
const SETTINGS_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Fetches current admin delivery pricing settings from Supabase database.
 */
export async function getShippingSettings(): Promise<ShippingSettings> {
  const now = Date.now();
  if (_cachedSettings && now < _cacheExpiry) {
    return _cachedSettings;
  }

  try {
    const { data, error } = await supabase
      .from('shipping_settings')
      .select('id, gujarat_rate_per_kg, outside_gujarat_rate_per_kg, south_india_rate_per_kg, gujarat_rate_per_500g, outside_gujarat_rate_per_500g, south_india_rate_per_500g, updated_at')
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return DEFAULT_SHIPPING_SETTINGS;
    }

    const settings: ShippingSettings = {
      id: data.id,
      gujarat_rate_per_kg: Number(data.gujarat_rate_per_kg) || (data.gujarat_rate_per_500g ? Number(data.gujarat_rate_per_500g) * 2 : DEFAULT_SHIPPING_SETTINGS.gujarat_rate_per_kg),
      outside_gujarat_rate_per_kg: Number(data.outside_gujarat_rate_per_kg) || (data.outside_gujarat_rate_per_500g ? Number(data.outside_gujarat_rate_per_500g) * 2 : DEFAULT_SHIPPING_SETTINGS.outside_gujarat_rate_per_kg),
      south_india_rate_per_kg: Number(data.south_india_rate_per_kg) || (data.south_india_rate_per_500g ? Number(data.south_india_rate_per_500g) * 2 : DEFAULT_SHIPPING_SETTINGS.south_india_rate_per_kg),
      updated_at: data.updated_at
    };

    _cachedSettings = settings;
    _cacheExpiry = now + SETTINGS_CACHE_TTL_MS;
    return settings;
  } catch (err) {
    console.warn('[ShippingCalculator] Failed to load shipping_settings from DB, using defaults:', err);
    return DEFAULT_SHIPPING_SETTINGS;
  }
}

/**
 * Updates admin delivery pricing settings in Supabase database.
 */
export async function updateShippingSettings(settings: Partial<ShippingSettings>): Promise<{ success: boolean; data?: ShippingSettings; error?: string }> {
  try {
    const gujaratRate = Number(settings.gujarat_rate_per_kg) || DEFAULT_SHIPPING_SETTINGS.gujarat_rate_per_kg;
    const outsideGujaratRate = Number(settings.outside_gujarat_rate_per_kg) || DEFAULT_SHIPPING_SETTINGS.outside_gujarat_rate_per_kg;
    const southIndiaRate = Number(settings.south_india_rate_per_kg) || DEFAULT_SHIPPING_SETTINGS.south_india_rate_per_kg;

    const payload = {
      gujarat_rate_per_kg: gujaratRate,
      outside_gujarat_rate_per_kg: outsideGujaratRate,
      south_india_rate_per_kg: southIndiaRate,
      // Store per 500g equivalent for legacy compatibility if needed
      gujarat_rate_per_500g: Math.round(gujaratRate / 2),
      outside_gujarat_rate_per_500g: Math.round(outsideGujaratRate / 2),
      south_india_rate_per_500g: Math.round(southIndiaRate / 2),
      updated_at: new Date().toISOString()
    };

    // Check if row exists
    const { data: existing } = await supabase.from('shipping_settings').select('id').limit(1).maybeSingle();

    let result;
    if (existing?.id) {
      result = await supabase.from('shipping_settings').update(payload).eq('id', existing.id).select().single();
    } else {
      result = await supabase.from('shipping_settings').insert([payload]).select().single();
    }

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    // Invalidate in-memory cache
    _cachedSettings = null;
    _cacheExpiry = 0;

    return {
      success: true,
      data: {
        id: result.data.id,
        gujarat_rate_per_kg: Number(result.data.gujarat_rate_per_kg) || gujaratRate,
        outside_gujarat_rate_per_kg: Number(result.data.outside_gujarat_rate_per_kg) || outsideGujaratRate,
        south_india_rate_per_kg: Number(result.data.south_india_rate_per_kg) || southIndiaRate,
        updated_at: result.data.updated_at
      }
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update delivery settings' };
  }
}

export interface ShippingCalculationResult {
  zone: 'Gujarat' | 'South India' | 'Outside Gujarat';
  ratePerKg: number;
  totalWeightKg: number;
  chargeableWeightKg: number;
  totalShippingCharge: number;
  estimatedDeliveryTime: string;
}

/**
 * Calculates delivery charge based on STARTED kilogram slabs:
 * Formula:
 *   Chargeable Weight (KG) = Math.ceil(totalWeightKg)
 *   Delivery Charge = Chargeable Weight * Rate Per KG
 */
export function calculateSlabShipping(
  cart: any[],
  address?: { pincode?: string; state?: string },
  settings: ShippingSettings = DEFAULT_SHIPPING_SETTINGS
): ShippingCalculationResult {
  const cleanPin = (address?.pincode || '').trim();
  const cleanState = (address?.state || '').trim().toLowerCase();

  // 1. Total cart weight calculation
  const totalWeightKg = calculateCartTotalWeight(cart);

  // 2. Compute Started Kilogram Slabs (round UP: 0.18kg -> 1kg, 1.25kg -> 2kg)
  const chargeableWeightKg = totalWeightKg > 0 ? Math.ceil(totalWeightKg) : 1;

  // 3. Region Detection
  let zone: 'Gujarat' | 'South India' | 'Outside Gujarat';
  let ratePerKg = settings.outside_gujarat_rate_per_kg;
  let estimatedDeliveryTime = '2-4 Days';

  const isGujaratState = cleanState === 'gujarat';
  const isGujaratPincode = cleanPin.startsWith('36') || cleanPin.startsWith('37') || cleanPin.startsWith('38') || cleanPin.startsWith('39');

  if (isGujaratState || isGujaratPincode) {
    zone = 'Gujarat';
    ratePerKg = settings.gujarat_rate_per_kg;
    estimatedDeliveryTime = '1-2 Days';
  } else {
    const isSouthState = SOUTH_INDIA_STATES.includes(cleanState);
    const prefix2 = parseInt(cleanPin.slice(0, 2), 10);
    const isSouthPin = !isNaN(prefix2) && prefix2 >= 50 && prefix2 <= 69;

    if (isSouthState || isSouthPin) {
      zone = 'South India';
      ratePerKg = settings.south_india_rate_per_kg;
      estimatedDeliveryTime = '3-5 Days';
    } else {
      zone = 'Outside Gujarat';
      ratePerKg = settings.outside_gujarat_rate_per_kg;
      estimatedDeliveryTime = '2-4 Days';
    }
  }

  // 4. Calculate total delivery charge
  const totalShippingCharge = totalWeightKg > 0 ? (chargeableWeightKg * ratePerKg) : 0;

  return {
    zone,
    ratePerKg,
    totalWeightKg,
    chargeableWeightKg,
    totalShippingCharge,
    estimatedDeliveryTime
  };
}
