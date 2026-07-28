const { getShiprocketToken } = require('../src/lib/services/shiprocket/auth');
const { checkShiprocketServiceability } = require('../src/lib/services/shiprocket/serviceability');
const { parseWeightToKg, calculateOrderTotalWeight } = require('../src/lib/services/shiprocket/shipment');

async function testShiprocketIntegration() {
  console.log('==================================================');
  console.log('TEST 1: Weight Parsing & Calculation');
  console.log('  - "500g" ->', parseWeightToKg('500g'), 'kg (Expected 0.5)');
  console.log('  - "1kg" ->', parseWeightToKg('1kg'), 'kg (Expected 1.0)');
  console.log('  - "250g" x 4 ->', calculateOrderTotalWeight([{ weight: '250g', quantity: 4 }]), 'kg (Expected 1.0)');
  console.log('--------------------------------------------------');

  console.log('TEST 2: Shiprocket Auth Service');
  try {
    const authRes = await getShiprocketToken();
    console.log('  - Auth Result Success:', authRes.success);
    console.log('  - Token Received:', authRes.token ? authRes.token.slice(0, 20) + '...' : 'None');
    console.log('  - Is Fallback Mode:', !!authRes.isFallback);
  } catch (err) {
    console.error('  - Auth Test Error:', err.message);
  }
  console.log('--------------------------------------------------');

  console.log('TEST 3: Pincode Serviceability Check (396001 - Gujarat)');
  try {
    const servRes = await checkShiprocketServiceability('396001', 0.5, false, 500);
    console.log('  - Serviceable:', servRes.serviceable);
    console.log('  - Delivery Charge: ₹', servRes.deliveryCharge);
    console.log('  - ETA:', servRes.estimatedDeliveryTime);
    console.log('  - Available Couriers Count:', servRes.availableCouriers ? servRes.availableCouriers.length : 0);
    if (servRes.recommendedCourier) {
      console.log('  - Recommended Courier:', servRes.recommendedCourier.courierName, '(₹' + servRes.recommendedCourier.rate + ')');
    }
  } catch (err) {
    console.error('  - Serviceability Test Error:', err.message);
  }
  console.log('==================================================');
}

testShiprocketIntegration().catch(console.error);
