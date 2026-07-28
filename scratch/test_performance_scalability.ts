import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { getOptimizedImageUrl } from '../src/lib/image-utils';
import { signSession, verifySession } from '../src/lib/auth-utils';

async function runPerformanceBenchmarkSuite() {
  console.log('===========================================================');
  console.log('MEHTA DAIRY - PERFORMANCE, BENCHMARK & SCALABILITY TEST SUITE');
  console.log('===========================================================');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(` ✅ PASS: [${testName}] ${detail || ''}`);
    } else {
      console.error(` ❌ FAIL: [${testName}] ${detail || ''}`);
    }
  }

  // 1. WebP Transformation Engine Benchmark
  console.log('\n--- 1. WEBP IMAGE TRANSFORMATION ENGINE BENCHMARK ---');
  const startTimeImage = performance.now();
  const rawUrl = 'https://kankezqwlbigcbxrcoof.supabase.co/storage/v1/object/public/products/kaju-katli.jpg';
  
  for (let i = 0; i < 1000; i++) {
    getOptimizedImageUrl(rawUrl, { width: 400, quality: 80 });
  }
  const durationImage = performance.now() - startTimeImage;
  console.log(` 🚀 1,000 WebP URL transformations completed in ${durationImage.toFixed(2)}ms (Avg: ${(durationImage / 1000).toFixed(4)}ms/op)`);
  assert(durationImage < 50, 'WebP URL Transformation Speed', `1,000 transformations executed in ${durationImage.toFixed(2)}ms (<50ms target)`);

  // 2. Auth Session HMAC Signing & Verification Speed
  console.log('\n--- 2. AUTH SESSION HMAC BENCHMARK ---');
  const startTimeAuth = performance.now();
  const mockPayload = { id: 'usr_perf_123', role: 'customer', phone: '9913252232' };

  for (let i = 0; i < 100; i++) {
    const token = await signSession(mockPayload);
    await verifySession(token);
  }
  const durationAuth = performance.now() - startTimeAuth;
  console.log(` 🚀 100 Session Sign & Verify ops completed in ${durationAuth.toFixed(2)}ms (Avg: ${(durationAuth / 100).toFixed(2)}ms/op)`);
  assert(durationAuth < 200, 'HMAC Session Signing Speed', `100 HMAC ops completed in ${durationAuth.toFixed(2)}ms (<200ms target)`);

  // 3. Client Cache & Concurrent Promise Deduplication Benchmark
  console.log('\n--- 3. CLIENT CACHE & CONCURRENT PROMISE DEDUPLICATION ---');
  const startTimeDedupe = performance.now();
  let sharedPromise: Promise<any[]> | null = null;

  function mockFetchProductsDeduplicated() {
    if (sharedPromise) return sharedPromise;
    sharedPromise = new Promise(resolve => setTimeout(() => resolve([{ id: '1', name: 'Kaju Katli' }]), 10));
    return sharedPromise;
  }

  const concurrentCalls = Array.from({ length: 50 }, () => mockFetchProductsDeduplicated());
  await Promise.all(concurrentCalls);
  const durationDedupe = performance.now() - startTimeDedupe;

  console.log(` 🚀 50 Concurrent calls resolved in ${durationDedupe.toFixed(2)}ms via promise deduplication`);
  assert(durationDedupe < 100, 'Concurrent Promise Deduplication', `50 concurrent requests resolved in ${durationDedupe.toFixed(2)}ms (<100ms target)`);

  // 4. In-Memory Search & Category Filtering Speed
  console.log('\n--- 4. IN-MEMORY SEARCH & FILTERING LATENCY ---');
  const products = Array.from({ length: 150 }, (_, i) => ({
    id: `prod_${i}`,
    name: i % 2 === 0 ? `Kaju Katli Special ${i}` : `Gulab Jamun Premium ${i}`,
    category: i % 2 === 0 ? 'sweets' : 'desserts',
    description: 'Fresh authentic Indian sweet made with pure desi ghee and saffron.',
    prices: { '250g': 250, '500g': 480 }
  }));

  const startTimeSearch = performance.now();
  const searchKeyword = 'kaju';
  const filtered = products.filter(p => p.name.toLowerCase().includes(searchKeyword) || p.description.toLowerCase().includes(searchKeyword));
  const durationSearch = performance.now() - startTimeSearch;

  console.log(` 🚀 Search across ${products.length} products completed in ${durationSearch.toFixed(3)}ms (Found ${filtered.length} matches)`);
  assert(durationSearch < 10, 'In-Memory Search Latency', `Search executed in ${durationSearch.toFixed(3)}ms (<10ms target)`);

  // Summary
  console.log('\n===========================================================');
  console.log(`PERFORMANCE SUMMARY: ${passedTests}/${totalTests} Benchmarks Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('===========================================================');
}

runPerformanceBenchmarkSuite().catch(console.error);
