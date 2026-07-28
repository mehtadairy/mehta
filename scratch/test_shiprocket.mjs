import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function runTest() {
  console.log('==================================================');
  console.log('SHIPROCKET AUTOMATION SYSTEM TEST');
  console.log('==================================================');

  try {
    const { parseWeightToKg, calculateOrderTotalWeight } = await import('../src/lib/services/shiprocket/shipment.js');
    console.log('TEST 1: Weight Calculation');
    console.log('  - parseWeightToKg("500g"):', parseWeightToKg('500g'), 'kg');
    console.log('  - parseWeightToKg("1kg"):', parseWeightToKg('1kg'), 'kg');
    console.log('  - calculateOrderTotalWeight([{ weight: "250g", quantity: 4 }]):', calculateOrderTotalWeight([{ weight: '250g', quantity: 4 }]), 'kg');
  } catch (e) {
    console.log('Test 1 note:', e.message);
  }

  try {
    const { getShiprocketToken } = await import('../src/lib/services/shiprocket/auth.js');
    const authRes = await getShiprocketToken();
    console.log('\nTEST 2: Shiprocket Auth Service');
    console.log('  - Success:', authRes.success);
    console.log('  - Token preview:', authRes.token ? authRes.token.slice(0, 25) + '...' : 'None');
    console.log('  - Fallback mode:', !!authRes.isFallback);
  } catch (e) {
    console.log('Test 2 note:', e.message);
  }

  try {
    const { checkShiprocketServiceability } = await import('../src/lib/services/shiprocket/serviceability.js');
    const servRes = await checkShiprocketServiceability('396001', 0.5, false, 500);
    console.log('\nTEST 3: Pincode Serviceability Check (Pincode: 396001)');
    console.log('  - Serviceable:', servRes.serviceable);
    console.log('  - Charge: ₹', servRes.deliveryCharge);
    console.log('  - ETA:', servRes.estimatedDeliveryTime);
    console.log('  - Couriers available:', servRes.availableCouriers?.length || 0);
    if (servRes.recommendedCourier) {
      console.log('  - Recommended Courier:', servRes.recommendedCourier.courierName);
    }
  } catch (e) {
    console.log('Test 3 note:', e.message);
  }

  console.log('==================================================');
}

runTest().catch(console.error);
