-- ====================================================================
-- MASTER PERFORMANCE & INDEX OPTIMIZATION MIGRATION
-- Mehta Sweet Mart Production Database Engine Tuning
-- ====================================================================

-- 0. Ensure required columns exist safely
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipment_status TEXT DEFAULT 'Pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'PENDING';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_slug TEXT;

-- 1. Orders Indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_shipment_status ON public.orders(shipment_status);

-- 2. Order Items Indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- 3. Invoices Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON public.invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);

-- 4. Products Indexes
CREATE INDEX IF NOT EXISTS idx_products_category_slug ON public.products(category_slug);

-- 5. WhatsApp & Cart Indexes (Safe creation with exact column names)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'whatsapp_carts') THEN
    CREATE INDEX IF NOT EXISTS idx_whatsapp_carts_phone ON public.whatsapp_carts(phone);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'otp_verifications') THEN
    CREATE INDEX IF NOT EXISTS idx_otp_mobile_verified ON public.otp_verifications(mobile, verified);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_addresses') THEN
    CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON public.user_addresses(user_id);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_profiles') THEN
    CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON public.user_profiles(phone);
  END IF;
END $$;

-- 6. Analyze tables to update query planner statistics
ANALYZE public.orders;
ANALYZE public.order_items;
ANALYZE public.invoices;
ANALYZE public.products;
