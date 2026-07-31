import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key';

// Legacy standard client for public data fetching (products, categories, etc.)
export const supabase = createClient(supabaseUrl, supabaseKey);

// SSR-compatible browser client for Authentication
export function createBrowserSupabaseClient() {
  return createBrowserClient(supabaseUrl, supabaseKey);
}

import { Product, Category, sortCategories } from './types';

// Client-side simple memory caching system (5 min TTL)
const CACHE_TTL = 5 * 60 * 1000;

let cachedProducts: Product[] | null = null;
let cachedProductsTime = 0;

let cachedCategories: any[] | null = null;
let cachedCategoriesTime = 0;

let cachedBanners: any[] | null = null;
let cachedBannersTime = 0;

let cachedIngredients: any[] | null = null;
let cachedIngredientsTime = 0;

let pendingProductsPromise: Promise<Product[]> | null = null;
let pendingCategoriesPromise: Promise<any[]> | null = null;
let pendingBannersPromise: Promise<any[]> | null = null;

const PRODUCT_FIELDS = 'id, name, category_slug, description, images, prices, popular, festival_special, rating, reviews_count, stock, shelf_life, storage_instructions, allergens, dietary_tags, highlights, position, badges, active, is_active';
const PRODUCT_LIST_FIELDS = 'id, name, category_slug, images, prices, popular, festival_special, rating, reviews_count, stock, position, badges, active, is_active';

export async function fetchProducts(forceRefresh = false, includeInactive = false): Promise<Product[]> {
  const now = Date.now();
  if (cachedProducts && !forceRefresh && (now - cachedProductsTime < CACHE_TTL)) {
    return includeInactive ? cachedProducts : cachedProducts.filter(p => p.isActive !== false);
  }

  if (pendingProductsPromise && !forceRefresh) {
    const products = await pendingProductsPromise;
    return includeInactive ? products : products.filter(p => p.isActive !== false);
  }

  pendingProductsPromise = (async () => {
    let queryResult: any[] = [];
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_LIST_FIELDS);
    
    if (error) {
      console.warn('Could not fetch products, falling back...', error.message || error);
      queryResult = [];
    } else {
      queryResult = data || [];
    }

    const mapped: Product[] = queryResult.map(p => {
      let productIngredients = p.ingredients || [];
      let ingredientIds: string[] = [];
      if (p.product_ingredients && p.product_ingredients.length > 0) {
        productIngredients = p.product_ingredients
          .map((pi: any) => pi.ingredient?.name)
          .filter(Boolean);
        ingredientIds = p.product_ingredients
          .map((pi: any) => pi.ingredient?.id)
          .filter(Boolean);
      }
      
      const isActiveStatus = (p.is_active !== undefined && p.is_active !== null) 
        ? Boolean(p.is_active) 
        : ((p.active !== undefined && p.active !== null) ? Boolean(p.active) : true);

      return {
        id: p.id,
        name: p.name,
        category: p.category_slug,
        description: p.description,
        images: p.images,
        prices: p.prices,
        popular: p.popular,
        festivalSpecial: p.festival_special,
        rating: p.rating,
        reviewsCount: p.reviews_count,
        stock: p.stock,
        isActive: isActiveStatus,
        active: isActiveStatus,
        ingredients: productIngredients,
        ingredientIds: ingredientIds,
        shelfLife: p.shelf_life,
        storageInstructions: p.storage_instructions,
        allergens: p.allergens || [],
        dietaryTags: p.dietary_tags || [],
        highlights: p.highlights || [],
        position: p.position || 0,
        badges: p.badges || []
      };
    });

    mapped.sort((a, b) => (a.position || 0) - (b.position || 0));

    cachedProducts = mapped;
    cachedProductsTime = Date.now();
    pendingProductsPromise = null;
    return mapped;
  })();

  const allProducts = await pendingProductsPromise;
  return includeInactive ? allProducts : allProducts.filter(p => p.isActive !== false);
}

export async function fetchProductById(idOrSlug: string): Promise<Product | null> {
  const decoded = decodeURIComponent(idOrSlug);
  const allList = await fetchProducts();
  const cachedItem = allList.find(p => p.id === decoded || (p.name && p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') === decoded));

  try {
    const { data: p } = await supabase
      .from('products')
      .select(`${PRODUCT_FIELDS}, product_ingredients(ingredient:ingredients(id, name))`)
      .or(`id.eq.${decoded}`)
      .maybeSingle();

    if (p) {
      let productIngredients = p.ingredients || [];
      let ingredientIds: string[] = [];
      if (p.product_ingredients && p.product_ingredients.length > 0) {
        productIngredients = p.product_ingredients.map((pi: any) => pi.ingredient?.name).filter(Boolean);
        ingredientIds = p.product_ingredients.map((pi: any) => pi.ingredient?.id).filter(Boolean);
      }
      const isActiveStatus = (p.is_active !== undefined && p.is_active !== null) 
        ? Boolean(p.is_active) 
        : ((p.active !== undefined && p.active !== null) ? Boolean(p.active) : true);

      return {
        id: p.id,
        name: p.name,
        category: p.category_slug,
        description: p.description,
        images: p.images,
        prices: p.prices,
        popular: p.popular,
        festivalSpecial: p.festival_special,
        rating: p.rating,
        reviewsCount: p.reviews_count,
        stock: p.stock,
        isActive: isActiveStatus,
        active: isActiveStatus,
        ingredients: productIngredients,
        ingredientIds: ingredientIds,
        shelfLife: p.shelf_life,
        storageInstructions: p.storage_instructions,
        allergens: p.allergens || [],
        dietaryTags: p.dietary_tags || [],
        highlights: p.highlights || [],
        position: p.position || 0,
        badges: p.badges || []
      };
    }
  } catch (err) {
    console.warn('fetchProductById fallback to cached catalog item:', err);
  }

  return cachedItem || null;
}

export async function updateProductStatus(id: string, activeStatus: boolean): Promise<{ success: boolean; error?: string }> {
  // Invalidate cache
  cachedProducts = null;
  cachedProductsTime = 0;
  pendingProductsPromise = null;

  let { error } = await supabase
    .from('products')
    .update({ active: activeStatus, is_active: activeStatus })
    .eq('id', id);

  if (error && (error.message?.includes('is_active') || error.code === '42703')) {
    const { error: fallbackErr } = await supabase
      .from('products')
      .update({ active: activeStatus })
      .eq('id', id);
    error = fallbackErr;
  }

  if (error) {
    console.error('Error updating product active status:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function fetchCategories(forceRefresh = false): Promise<any[]> {
  const now = Date.now();
  if (cachedCategories && !forceRefresh && (now - cachedCategoriesTime < CACHE_TTL)) {
    return cachedCategories;
  }

  if (pendingCategoriesPromise && !forceRefresh) {
    return pendingCategoriesPromise;
  }

  pendingCategoriesPromise = (async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, description, image_url, sort_order, status')
      .order('sort_order', { ascending: true });

    if (error || !data) {
      pendingCategoriesPromise = null;
      return [];
    }

    const filtered = data.filter((c: any) => c.status !== 'inactive');
    const mapped = filtered.map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description || '',
      image: c.image_url || '',
      image_url: c.image_url || '',
      icon: '',
      sort_order: c.sort_order,
      status: c.status
    }));
    const sorted = sortCategories(mapped);
    
    cachedCategories = sorted;
    cachedCategoriesTime = Date.now();
    pendingCategoriesPromise = null;
    return sorted;
  })();

  return pendingCategoriesPromise;
}

export async function fetchBanners(forceRefresh = false): Promise<any[]> {
  const now = Date.now();
  if (cachedBanners && !forceRefresh && (now - cachedBannersTime < CACHE_TTL)) {
    return cachedBanners;
  }

  if (pendingBannersPromise && !forceRefresh) {
    return pendingBannersPromise;
  }

  pendingBannersPromise = (async () => {
    const { data, error } = await supabase
      .from('banners')
      .select('id, image_url, badge, headline, boldline, sub, cta_label, link, is_graphic_only, active, created_at')
      .eq('active', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("fetchBanners error:", error);
      pendingBannersPromise = null;
      return [];
    }
    
    cachedBanners = data;
    cachedBannersTime = Date.now();
    pendingBannersPromise = null;
    return data;
  })();

  return pendingBannersPromise;
}

export async function fetchIngredients(forceRefresh = false): Promise<any[]> {
  const now = Date.now();
  if (cachedIngredients && !forceRefresh && (now - cachedIngredientsTime < CACHE_TTL)) {
    return cachedIngredients;
  }

  const { data, error } = await supabase.from('ingredients').select('id, name, icon').order('name', { ascending: true });
  if (error) {
    console.error('Error fetching ingredients:', error);
    return [];
  }
  
  cachedIngredients = data;
  cachedIngredientsTime = now;
  return data;
}

export async function addIngredient(name: string, icon?: string): Promise<any | null> {
  const { data, error } = await supabase
    .from('ingredients')
    .insert([{ name, icon: icon || 'leaf' }])
    .select();
  if (error) {
    console.error('Error adding ingredient:', error);
    return null;
  }
  return data ? data[0] : null;
}

export async function deleteIngredient(id: string): Promise<boolean> {
  const { error } = await supabase.from('ingredients').delete().eq('id', id);
  if (error) {
    console.error('Error deleting ingredient:', error);
    return false;
  }
  return true;
}

export async function updateProductIngredients(productId: string, ingredientIds: string[]): Promise<void> {
  // Clear existing links
  await supabase.from('product_ingredients').delete().eq('product_id', productId);
  
  if (ingredientIds.length === 0) return;
  
  // Insert new links
  const links = ingredientIds.map(ingId => ({
    product_id: productId,
    ingredient_id: ingId
  }));
  
  const { error } = await supabase.from('product_ingredients').insert(links);
  if (error) {
    console.error('Error updating product ingredients:', error);
  }
}

