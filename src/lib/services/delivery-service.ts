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
  courierName?: string;
  zoneName?: string;
}

/**
 * Calculates delivery charges dynamically based on delivery_rules in Supabase.
 */
export async function calculateDeliveryCharge(
  stateName: string,
  weightInKg: number = 1
): Promise<DeliveryCalculationResult> {
  const cleanState = (stateName || '').trim().toLowerCase();
  if (!cleanState) {
    return { success: false, error: 'Valid State is required', deliveryCharge: 0, freeDeliveryEligible: false };
  }

  const actualWeight = Math.max(0.1, Number(weightInKg) || 1);
  const chargeableWeight = Math.ceil(actualWeight);

  try {
    // Fetch all rules
    const { data: rules, error } = await supabase.from('delivery_rules').select('*');
    if (error || !rules) throw error || new Error("No rules found");

    let matchedRule = null;
    let defaultRule = null;

    // Find the matching rule based on state
    for (const rule of rules) {
      if (rule.states === '*') {
        defaultRule = rule;
        continue;
      }
      const allowedStates = rule.states.toLowerCase().split(',').map((s: string) => s.trim());
      if (allowedStates.includes(cleanState)) {
        matchedRule = rule;
        break;
      }
    }

    // Use default if no explicit match
    if (!matchedRule) {
      matchedRule = defaultRule;
    }

    if (!matchedRule) {
      // Fallback if table is empty
      const isGujarat = cleanState === 'gujarat';
      const southIndiaStates = ['kerala', 'tamil nadu', 'karnataka', 'andhra pradesh', 'telangana'];
      const isSouthIndia = southIndiaStates.includes(cleanState);
      
      let fallbackZone = 'Rest of India (Fallback)';
      let fallbackRate = 70;
      if (isGujarat) {
         fallbackZone = 'Gujarat (Fallback)';
         fallbackRate = 40;
      } else if (isSouthIndia) {
         fallbackZone = 'South India (Fallback)';
         fallbackRate = 80;
      }

      matchedRule = {
        zone_name: fallbackZone,
        rate_per_kg: fallbackRate
      };
    }

    const ratePerKg = Number(matchedRule.rate_per_kg);
    const deliveryCharge = chargeableWeight * ratePerKg;

    return {
      success: true,
      city: matchedRule.zone_name,
      zoneName: matchedRule.zone_name,
      deliveryCharge,
      ratePerKg,
      weightInKg: actualWeight,
      estimatedDeliveryTime: '2-4 Days',
      freeDeliveryEligible: false,
      courierName: 'Standard Courier'
    };
  } catch (err) {
    console.warn('[DeliveryService] Failed to load rules, evaluating fallback calculation:', err);
    
    // Hard fallback
    const isGujarat = cleanState === 'gujarat';
    const southIndiaStates = ['kerala', 'tamil nadu', 'karnataka', 'andhra pradesh', 'telangana'];
    const isSouthIndia = southIndiaStates.includes(cleanState);
    
    let fallbackZone = 'Rest of India';
    let ratePerKg = 70;
    if (isGujarat) {
       fallbackZone = 'Gujarat';
       ratePerKg = 40;
    } else if (isSouthIndia) {
       fallbackZone = 'South India';
       ratePerKg = 80;
    }

    const deliveryCharge = chargeableWeight * ratePerKg;

    return {
      success: true,
      city: fallbackZone,
      zoneName: fallbackZone,
      deliveryCharge,
      ratePerKg,
      weightInKg: actualWeight,
      estimatedDeliveryTime: '2-4 Days',
      freeDeliveryEligible: false
    };
  }
}
