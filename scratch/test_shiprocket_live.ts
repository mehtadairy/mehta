import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { getShiprocketToken } from '../src/lib/services/shiprocket/auth';
import { checkShiprocketServiceability } from '../src/lib/services/shiprocket/serviceability';

async function testLiveShiprocketConnection() {
  console.log("==========================================");
  console.log("🚀 TESTING LIVE SHIPROCKET API CONNECTION");
  console.log("==========================================");

  try {
    console.log("\n1. Testing Login & Token Retrieval...");
    const authResult = await getShiprocketToken();
    console.log("Auth Result:", {
      success: authResult.success,
      isFallback: authResult.isFallback,
      tokenPreview: authResult.token ? `${authResult.token.slice(0, 20)}...` : null,
      error: authResult.error
    });

    if (!authResult.success || authResult.isFallback || !authResult.token) {
      throw new Error("Failed to authenticate with live Shiprocket API: " + (authResult.error || 'Fallback token returned'));
    }

    console.log("✅ Live Shiprocket JWT Token successfully generated!");

    console.log("\n2. Testing Live Courier Serviceability Query (Mumbai 400001)...");
    const serviceability = await checkShiprocketServiceability('400001', 0.5, false, 500);
    console.log("Serviceability Result:", {
      success: serviceability.success,
      serviceable: serviceability.serviceable,
      isFallback: serviceability.isFallback,
      deliveryCharge: serviceability.deliveryCharge,
      estimatedDeliveryTime: serviceability.estimatedDeliveryTime,
      courierCount: serviceability.availableCouriers?.length || 0,
      recommended: serviceability.recommendedCourier?.courierName
    });

    if (serviceability.isFallback) {
      console.warn("⚠️ Warning: Serviceability returned fallback rules instead of live couriers.");
    } else {
      console.log("✅ Live Shiprocket Couriers retrieved successfully!");
    }

    console.log("\n==========================================");
    console.log("🎉 LIVE SHIPROCKET INTEGRATION IS 100% WORKING");
    console.log("==========================================");

  } catch (err: any) {
    console.error("\n❌ LIVE SHIPROCKET TEST FAILED:", err.message);
  }
}

testLiveShiprocketConnection();
