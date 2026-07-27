-- 1. Create whatsapp_carts table
CREATE TABLE IF NOT EXISTS public.whatsapp_carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Create whatsapp_cart_items table
CREATE TABLE IF NOT EXISTS public.whatsapp_cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES public.whatsapp_carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    image TEXT,
    price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. Create indices for performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_carts_phone ON public.whatsapp_carts(phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_cart_items_cart_id ON public.whatsapp_cart_items(cart_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.whatsapp_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_cart_items ENABLE ROW LEVEL SECURITY;

-- 5. Enable public access policies for ease of serverless API handler invocation
DROP POLICY IF EXISTS "Allow public read access on whatsapp_carts" ON public.whatsapp_carts;
CREATE POLICY "Allow public read access on whatsapp_carts" ON public.whatsapp_carts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access on whatsapp_carts" ON public.whatsapp_carts;
CREATE POLICY "Allow public insert access on whatsapp_carts" ON public.whatsapp_carts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access on whatsapp_carts" ON public.whatsapp_carts;
CREATE POLICY "Allow public update access on whatsapp_carts" ON public.whatsapp_carts FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete access on whatsapp_carts" ON public.whatsapp_carts;
CREATE POLICY "Allow public delete access on whatsapp_carts" ON public.whatsapp_carts FOR DELETE USING (true);

-- Items policies
DROP POLICY IF EXISTS "Allow public read access on whatsapp_cart_items" ON public.whatsapp_cart_items;
CREATE POLICY "Allow public read access on whatsapp_cart_items" ON public.whatsapp_cart_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access on whatsapp_cart_items" ON public.whatsapp_cart_items;
CREATE POLICY "Allow public insert access on whatsapp_cart_items" ON public.whatsapp_cart_items FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access on whatsapp_cart_items" ON public.whatsapp_cart_items;
CREATE POLICY "Allow public update access on whatsapp_cart_items" ON public.whatsapp_cart_items FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete access on whatsapp_cart_items" ON public.whatsapp_cart_items;
CREATE POLICY "Allow public delete access on whatsapp_cart_items" ON public.whatsapp_cart_items FOR DELETE USING (true);
