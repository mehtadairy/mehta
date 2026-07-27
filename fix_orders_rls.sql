-- Run this in your Supabase SQL Editor to allow updating order status from the Admin Panel
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public update access on orders" ON public.orders;
CREATE POLICY "Allow public update access on orders"
ON public.orders
FOR UPDATE
USING (true);

-- Also ensure INSERT and SELECT are allowed if not already:
DROP POLICY IF EXISTS "Allow public read access on orders" ON public.orders;
CREATE POLICY "Allow public read access on orders"
ON public.orders
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow public insert access on orders" ON public.orders;
CREATE POLICY "Allow public insert access on orders"
ON public.orders
FOR INSERT
WITH CHECK (true);
