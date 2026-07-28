import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { getOptimizedImageUrl } from '../src/lib/image-utils';
import { fetchProducts, fetchCategories } from '../src/lib/supabaseClient';

async function runPerformanceAudit() {
  console.log('==================================================');
  console.log('PRODUCTION PERFORMANCE & SUPABASE EGRESS AUDIT');
  console.log('==================================================');

  // 1. Image Optimization Helper Test
  const sampleSupabaseUrl = 'https://kankezqwlbigcbxrcoof.supabase.co/storage/v1/object/public/products/kaju_katli.jpg';
  const optimizedCardUrl = getOptimizedImageUrl(sampleSupabaseUrl, 300, 75);
  const optimizedHeroUrl = getOptimizedImageUrl(sampleSupabaseUrl, 1200, 85);

  console.log('TEST 1: Supabase Storage Image Transformation URLs');
  console.log('  - Raw Storage URL:', sampleSupabaseUrl);
  console.log('  - Optimized Card URL (300px WebP):', optimizedCardUrl);
  console.log('  - Optimized Hero URL (1200px WebP):', optimizedHeroUrl);
  console.log('--------------------------------------------------');

  // 2. Database Query Field Filter Audit
  console.log('TEST 2: Supabase Query Field Selection & In-Memory Caching');
  const start = Date.now();
  const prods = await fetchProducts();
  const duration1 = Date.now() - start;

  const start2 = Date.now();
  const prodsCached = await fetchProducts();
  const duration2 = Date.now() - start2;

  console.log(`  - Initial Fetch Duration: ${duration1}ms (Fetched ${prods.length} products with targeted field selection)`);
  console.log(`  - Cached Fetch Duration: ${duration2}ms (In-memory cached)`);
  console.log('--------------------------------------------------');

  console.log('TEST 3: Category Query Field Selection');
  const cats = await fetchCategories();
  console.log(`  - Categories Fetched: ${cats.length} items`);
  console.log('==================================================');
}

runPerformanceAudit().catch(console.error);
