import { supabase } from '../supabaseClient';
import { calculateCartTotalWeight } from './shiprocket/weight-calculator';

export interface ShippingSettings {
  id?: string;
  gujarat_rate_per_500g: number;
  outside_gujarat_rate_per_500g: number;
  south_india_rate_per_500g: number;
  palitana_free_shipping: boolean;
  updated_at?: string;
}

export const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  gujarat_rate_per_500g: 20,
  outside_gujarat_rate_per_500g: 35,
  south_india_rate_per_500g: 40,
  palitana_free_shipping: true
};

const SOUTH_INDIA_STATES = [
  'karnataka',
  'kerala',
  'tamil nadu',
  'andhra pradesh',
  'telangana',
  'puducherry'
];

// ─── In-memory cache for shipping settings (5-minute TTL) ───────────────────
let _cachedSettings: ShippingSettings | null = null;
let _cacheExpiry = 0;
const SETTINGS_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Fetches current admin shipping settings from Supabase database.
 * Results are cached in-memory for 5 minutes to avoid repeated DB reads per checkout.
 * Uses default fallback if database row is missing or unreachable.
 */
export async function getShippingSettings(): Promise<ShippingSettings> {
  const now = Date.now();
  if (_cachedSettings && now < _cacheExpiry) {
    return _cachedSettings;
  }

  try {
    const { data, error } = await supabase
      .from('shipping_settings')
      .select('id, gujarat_rate_per_500g, outside_gujarat_rate_per_500g, south_india_rate_per_500g, palitana_free_shipping, updated_at')
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return DEFAULT_SHIPPING_SETTINGS;
    }

    const settings: ShippingSettings = {
      id: data.id,
      gujarat_rate_per_500g: Number(data.gujarat_rate_per_500g) || DEFAULT_SHIPPING_SETTINGS.gujarat_rate_per_500g,
      outside_gujarat_rate_per_500g: Number(data.outside_gujarat_rate_per_500g) || DEFAULT_SHIPPING_SETTINGS.outside_gujarat_rate_per_500g,
      south_india_rate_per_500g: Number(data.south_india_rate_per_500g) || DEFAULT_SHIPPING_SETTINGS.south_india_rate_per_500g,
      palitana_free_shipping: data.palitana_free_shipping ?? DEFAULT_SHIPPING_SETTINGS.palitana_free_shipping,
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
 * Updates admin shipping settings in Supabase database.
 */
export async function updateShippingSettings(settings: Partial<ShippingSettings>): Promise<{ success: boolean; data?: ShippingSettings; error?: string }> {
  try {
    const payload = {
      gujarat_rate_per_500g: Number(settings.gujarat_rate_per_500g),
      outside_gujarat_rate_per_500g: Number(settings.outside_gujarat_rate_per_500g),
      south_india_rate_per_500g: Number(settings.south_india_rate_per_500g),
      palitana_free_shipping: settings.palitana_free_shipping ?? true,
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

    // Invalidate the in-memory cache so next checkout picks up new rates immediately
    _cachedSettings = null;
    _cacheExpiry = 0;

    return { success: true, data: result.data as ShippingSettings };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update shipping settings' };
  }
}

export interface ShippingCalculationResult {
  zone: 'Local (Palitana)' | 'Gujarat' | 'South India' | 'Outside Gujarat';
  ratePerSlab: number;
  totalWeightKg: number;
  slabsCount: number;
  totalShippingCharge: number;
  estimatedDeliveryTime: string;
}

/**
 * Calculates exact slab shipping charge using started 500g slabs:
 * Formula:
 *   Slabs = CEILING(total_weight_kg / 0.5)
 *   Shipping Charge = Slabs * Region Price
 */
export function calculateSlabShipping(
  cart: any[],
  address?: { pincode?: string; state?: string },
  settings: ShippingSettings = DEFAULT_SHIPPING_SETTINGS
): ShippingCalculationResult {
  const cleanPin = (address?.pincode || '').trim();
  const cleanState = (address?.state || '').trim().toLowerCase();

  // 1. Total cart weight calculation for ALL products
  const totalWeightKg = calculateCartTotalWeight(cart);

  // 2. Compute Started 500g Slabs
  // Every started 500g = 1 slab
  const slabsCount = totalWeightKg > 0 ? Math.ceil(totalWeightKg / 0.5) : 0;

  // 3. Region Detection
  let zone: 'Local (Palitana)' | 'Gujarat' | 'South India' | 'Outside Gujarat';
  let ratePerSlab = settings.outside_gujarat_rate_per_500g;
  let estimatedDeliveryTime = '2-4 Days';

  // Check Local Palitana (364270)
  if (cleanPin === '364270' && settings.palitana_free_shipping) {
    zone = 'Local (Palitana)';
    ratePerSlab = 0;
    estimatedDeliveryTime = 'Same Day / 1 Day';
  } else {
    // Check Gujarat
    const isGujaratState = cleanState === 'gujarat';
    const isGujaratPincode = cleanPin.startsWith('36') || cleanPin.startsWith('37') || cleanPin.startsWith('38') || cleanPin.startsWith('39');
    
    if (isGujaratState || isGujaratPincode) {
      zone = 'Gujarat';
      ratePerSlab = settings.gujarat_rate_per_500g;
      estimatedDeliveryTime = '1-2 Days';
    } else {
      // Check South India
      const isSouthState = SOUTH_INDIA_STATES.includes(cleanState);
      const prefix2 = parseInt(cleanPin.slice(0, 2), 10);
      const isSouthPin = !isNaN(prefix2) && prefix2 >= 50 && prefix2 <= 69;

      if (isSouthState || isSouthPin) {
        zone = 'South India';
        ratePerSlab = settings.south_india_rate_per_500g;
        estimatedDeliveryTime = '3-5 Days';
      } else {
        zone = 'Outside Gujarat';
        ratePerSlab = settings.outside_gujarat_rate_per_500g;
        estimatedDeliveryTime = '2-4 Days';
      }
    }
  }

  // 4. Calculate total shipping charge
  const totalShippingCharge = zone === 'Local (Palitana)' ? 0 : (slabsCount * ratePerSlab);

  return {
    zone,
    ratePerSlab,
    totalWeightKg,
    slabsCount,
    totalShippingCharge,
    estimatedDeliveryTime
  };
}
