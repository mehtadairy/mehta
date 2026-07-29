import { supabase } from '../supabaseClient';
import { calculateCartTotalWeight } from './shiprocket/weight-calculator';

export interface ShippingSettings {
  id?: string;
  gujarat_rate_per_500g: number;
  outside_gujarat_rate_per_500g: number;
  south_india_rate_per_500g: number;
  coin_khakhra_surcharge: number;
  palitana_free_shipping: boolean;
  updated_at?: string;
}

export const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  gujarat_rate_per_500g: 20,
  outside_gujarat_rate_per_500g: 35,
  south_india_rate_per_500g: 40,
  coin_khakhra_surcharge: 20,
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

/**
 * Fetches current admin shipping settings from Supabase database.
 * Uses default fallback if database row is missing or unreachable.
 */
export async function getShippingSettings(): Promise<ShippingSettings> {
  try {
    const { data, error } = await supabase
      .from('shipping_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return DEFAULT_SHIPPING_SETTINGS;
    }

    return {
      id: data.id,
      gujarat_rate_per_500g: Number(data.gujarat_rate_per_500g) || DEFAULT_SHIPPING_SETTINGS.gujarat_rate_per_500g,
      outside_gujarat_rate_per_500g: Number(data.outside_gujarat_rate_per_500g) || DEFAULT_SHIPPING_SETTINGS.outside_gujarat_rate_per_500g,
      south_india_rate_per_500g: Number(data.south_india_rate_per_500g) || DEFAULT_SHIPPING_SETTINGS.south_india_rate_per_500g,
      coin_khakhra_surcharge: Number(data.coin_khakhra_surcharge) || DEFAULT_SHIPPING_SETTINGS.coin_khakhra_surcharge,
      palitana_free_shipping: data.palitana_free_shipping ?? DEFAULT_SHIPPING_SETTINGS.palitana_free_shipping,
      updated_at: data.updated_at
    };
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
      coin_khakhra_surcharge: Number(settings.coin_khakhra_surcharge),
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

    return { success: true, data: result.data as ShippingSettings };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update shipping settings' };
  }
}

/**
 * Checks if a cart item is Coin Khakhra
 */
export function isCoinKhakhraItem(item: any): boolean {
  if (!item) return false;
  const name = String(item.name || item.productName || '').toLowerCase();
  const weight = String(item.weight || '').toLowerCase();
  return name.includes('coin khakhra') || (name.includes('khakhra') && weight.includes('180'));
}

export interface ShippingCalculationResult {
  zone: 'Local (Palitana)' | 'Gujarat' | 'South India' | 'Outside Gujarat';
  ratePerSlab: number;
  totalWeightKg: number;
  billableWeightKg: number;
  slabsCount: number;
  baseShippingCharge: number;
  hasCoinKhakhra: boolean;
  isCoinKhakhraAlone: boolean;
  coinKhakhraSurcharge: number;
  totalShippingCharge: number;
  estimatedDeliveryTime: string;
}

/**
 * Calculates exact slab shipping charge based on admin settings:
 * - 500g Started Slab calculation (e.g. 250g -> 1 slab, 750g -> 2 slabs)
 * - Coin Khakhra Special Surcharge rules
 * - State & Pincode region detection
 */
export function calculateSlabShipping(
  cart: any[],
  address?: { pincode?: string; state?: string },
  settings: ShippingSettings = DEFAULT_SHIPPING_SETTINGS
): ShippingCalculationResult {
  const cleanPin = (address?.pincode || '').trim();
  const cleanState = (address?.state || '').trim().toLowerCase();

  // 1. Separate Coin Khakhra items
  const khakhraItems = cart.filter(item => isCoinKhakhraItem(item));
  const nonKhakhraItems = cart.filter(item => !isCoinKhakhraItem(item));

  const hasCoinKhakhra = khakhraItems.length > 0;
  const isCoinKhakhraAlone = hasCoinKhakhra && nonKhakhraItems.length === 0;

  // 2. Compute billable weight
  // If Coin Khakhra is ordered with other items, ignore its weight and add surcharge once
  const cartForWeight = isCoinKhakhraAlone ? cart : nonKhakhraItems;
  const totalWeightKg = calculateCartTotalWeight(cart);
  const billableWeightKg = calculateCartTotalWeight(cartForWeight);

  // 3. Compute Started 500g Slabs
  // Every started 500g = 1 slab
  const slabsCount = billableWeightKg > 0 ? Math.ceil(billableWeightKg / 0.5) : 0;

  // 4. Region Detection
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

  // 5. Calculate base shipping charge
  const baseShippingCharge = zone === 'Local (Palitana)' ? 0 : (slabsCount * ratePerSlab);

  // 6. Coin Khakhra Surcharge (fixed ₹20 if ordered alongside other products)
  const coinKhakhraSurcharge = (hasCoinKhakhra && !isCoinKhakhraAlone && zone !== 'Local (Palitana)') 
    ? settings.coin_khakhra_surcharge 
    : 0;

  const totalShippingCharge = baseShippingCharge + coinKhakhraSurcharge;

  return {
    zone,
    ratePerSlab,
    totalWeightKg,
    billableWeightKg,
    slabsCount,
    baseShippingCharge,
    hasCoinKhakhra,
    isCoinKhakhraAlone,
    coinKhakhraSurcharge,
    totalShippingCharge,
    estimatedDeliveryTime
  };
}
