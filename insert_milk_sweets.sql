-- SQL script to insert Categories AND Pure Milk Sweets

-- 0. Ensure Categories table has all required columns
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Categories are already present, proceeding to Products.

-- 2. Insert Products
INSERT INTO public.products (
  name, 
  category_slug, 
  description, 
  images, 
  prices, 
  popular, 
  festival_special, 
  stock, 
  rating, 
  reviews_count
) VALUES
('Kesar Penda', 'milk-sweets', 'Premium Kesar Penda made from pure milk. Authentic heritage recipe.', '["/mix_sweet_rolls_1781172915749.png"]'::jsonb, '{"500g": 420, "1kg": 840}'::jsonb, true, false, 50, 5, 0),
('White Penda (Malai Penda)', 'milk-sweets', 'Premium White Penda (Malai Penda) made from pure milk. Authentic heritage recipe.', '["/mix_sweet_rolls_1781172915749.png"]'::jsonb, '{"500g": 400, "1kg": 800}'::jsonb, true, false, 50, 5, 0),
('Brown Penda (Paka Penda)', 'milk-sweets', 'Premium Brown Penda (Paka Penda) made from pure milk. Authentic heritage recipe.', '["/mix_sweet_rolls_1781172915749.png"]'::jsonb, '{"500g": 420, "1kg": 840}'::jsonb, true, false, 50, 5, 0),
('Mithomavo (Thabadi)', 'milk-sweets', 'Premium Mithomavo (Thabadi) made from pure milk. Authentic heritage recipe.', '["/mix_sweet_rolls_1781172915749.png"]'::jsonb, '{"500g": 420, "1kg": 840}'::jsonb, true, false, 50, 5, 0),
('Gulab Halvo', 'milk-sweets', 'Premium Gulab Halvo made from pure milk. Authentic heritage recipe.', '["/mix_sweet_rolls_1781172915749.png"]'::jsonb, '{"500g": 430, "1kg": 860}'::jsonb, true, false, 50, 5, 0),
('Kesar Barfi', 'milk-sweets', 'Premium Kesar Barfi made from pure milk. Authentic heritage recipe.', '["/mix_sweet_rolls_1781172915749.png"]'::jsonb, '{"500g": 410, "1kg": 820}'::jsonb, true, false, 50, 5, 0),
('Cadburi Roll', 'milk-sweets', 'Premium Cadburi Roll made from pure milk. Authentic heritage recipe.', '["/mix_sweet_rolls_1781172915749.png"]'::jsonb, '{"500g": 420, "1kg": 840}'::jsonb, true, false, 50, 5, 0),
('Coconut Sweet (Toparapak)', 'milk-sweets', 'Premium Coconut Sweet (Toparapak) made from pure milk. Authentic heritage recipe.', '["/mix_sweet_rolls_1781172915749.png"]'::jsonb, '{"500g": 380, "1kg": 760}'::jsonb, true, false, 50, 5, 0),
('White Kalakand', 'milk-sweets', 'Premium White Kalakand made from pure milk. Authentic heritage recipe.', '["/mix_sweet_rolls_1781172915749.png"]'::jsonb, '{"500g": 400, "1kg": 800}'::jsonb, true, false, 50, 5, 0),
('Kaju Katri', 'milk-sweets', 'Premium Kaju Katri made from pure milk. Authentic heritage recipe.', '["/prod_kaju_katli_1781172877393.png"]'::jsonb, '{"500g": 490, "1kg": 980}'::jsonb, true, false, 50, 5, 0);
