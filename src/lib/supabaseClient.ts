import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

import { Product, Category } from './types';

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from('products').select('*');
  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }
  return data.map(p => ({
    id: p.id, // we might need to map by name or something if ids changed, but wait, bestSellerIds are hardcoded to 't6', etc.
    // Ah, the mockData IDs like 't6' won't match Supabase UUIDs!
    name: p.name,
    category: p.category_slug,
    description: p.description,
    images: p.images,
    prices: p.prices,
    popular: p.popular,
    festivalSpecial: p.festival_special,
    rating: p.rating,
    reviewsCount: p.reviews_count,
    stock: p.stock
  }));
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
