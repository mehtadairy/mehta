-- Fix RLS: Allow public READ access for products and categories
-- Run this in Supabase SQL Editor

-- 1. Enable RLS (if not already enabled)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 2. Allow anyone to SELECT (read) products
DROP POLICY IF EXISTS "Allow public read access on products" ON public.products;
CREATE POLICY "Allow public read access on products"
ON public.products
FOR SELECT
USING (true);

-- 3. Allow anyone to SELECT (read) categories
DROP POLICY IF EXISTS "Allow public read access on categories" ON public.categories;
CREATE POLICY "Allow public read access on categories"
ON public.categories
FOR SELECT
USING (true);

-- 4. Verify: count products and categories
SELECT 'products' AS table_name, count(*) AS row_count FROM public.products
UNION ALL
SELECT 'categories' AS table_name, count(*) AS row_count FROM public.categories;
