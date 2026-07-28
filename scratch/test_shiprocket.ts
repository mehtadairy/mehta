import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { getShiprocketToken } from '../src/lib/services/shiprocket/auth';
import { checkShiprocketServiceability } from '../src/lib/services/shiprocket/serviceability';
import { parseWeightToKg, calculateOrderTotalWeight } from '../src/lib/services/shiprocket/shipment';

async function testShiprocketIntegration() {
  console.log('==================================================');
  console.log('SHIPROCKET AUTOMATION SYSTEM VERIFICATION');
  console.log('==================================================');

  console.log('TEST 1: Weight Calculation & Parsing');
  console.log('  - parseWeightToKg("500g"):', parseWeightToKg('500g'), 'kg');
  console.log('  - parseWeightToKg("1kg"):', parseWeightToKg('1kg'), 'kg');
  console.log('  - calculateOrderTotalWeight([{ weight: "250g", quantity: 4 }]):', calculateOrderTotalWeight([{ weight: '250g', quantity: 4 }]), 'kg');
  console.log('--------------------------------------------------');

  console.log('TEST 2: Shiprocket Auth Service');
  try {
    const authRes = await getShiprocketToken();
    console.log('  - Auth Success:', authRes.success);
    console.log('  - Token Preview:', authRes.token ? authRes.token.slice(0, 25) + '...' : 'None');
    console.log('  - Fallback Mode Active:', !!authRes.isFallback);
  } catch (err: any) {
    console.error('  - Auth Test Error:', err.message);
  }
  console.log('--------------------------------------------------');

  console.log('TEST 3: Pincode Serviceability Check (Pincode: 396001)');
  try {
    const servRes = await checkShiprocketServiceability('396001', 0.5, false, 500);
    console.log('  - Serviceable:', servRes.serviceable);
    console.log('  - Delivery Charge: ₹', servRes.deliveryCharge);
    console.log('  - Delivery ETA:', servRes.estimatedDeliveryTime);
    console.log('  - Couriers Available:', servRes.availableCouriers?.length || 0);
    if (servRes.recommendedCourier) {
      console.log('  - Recommended Courier:', servRes.recommendedCourier.courierName, '(Rate: ₹' + servRes.recommendedCourier.rate + ')');
    }
  } catch (err: any) {
    console.error('  - Serviceability Test Error:', err.message);
  }
  console.log('==================================================');
}

testShiprocketIntegration().catch(console.error);
