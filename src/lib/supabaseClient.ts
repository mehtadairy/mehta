import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

import { Product, Category } from './types';

export async function fetchProducts(): Promise<Product[]> {
  let queryResult;
  // Try to load with joined ingredients first
  const { data, error } = await supabase
    .from('products')
    .select('*, product_ingredients(ingredient:ingredients(*))');
  
  if (error) {
    console.warn('Could not fetch products with ingredients relation, falling back...', error.message);
    const { data: simpleData, error: simpleError } = await supabase.from('products').select('*');
    if (simpleError) {
      console.error('Error fetching products:', simpleError);
      return [];
    }
    queryResult = simpleData;
  } else {
    queryResult = data;
  }

  return queryResult.map(p => {
    // Extract dynamic ingredients names and ids if available
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
      ingredients: productIngredients,
      ingredientIds: ingredientIds,
      shelfLife: p.shelf_life,
      storageInstructions: p.storage_instructions,
      allergens: p.allergens || [],
      dietaryTags: p.dietary_tags || [],
      highlights: p.highlights || []
    };
  });
}

export async function fetchCategories(): Promise<any[]> {
  const { data, error } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
  if (error) return [];
  return data;
}

export async function fetchBanners(): Promise<any[]> {
  const { data, error } = await supabase.from('banners').select('*').eq('status', 'active').order('sort_order', { ascending: true });
  if (error) return [];
  return data;
}

export async function fetchIngredients(): Promise<any[]> {
  const { data, error } = await supabase.from('ingredients').select('*').order('name', { ascending: true });
  if (error) {
    console.error('Error fetching ingredients:', error);
    return [];
  }
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

