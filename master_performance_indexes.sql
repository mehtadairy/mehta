-- ====================================================================
-- MASTER PERFORMANCE & INDEX OPTIMIZATION MIGRATION (DBA REFINED)
-- Mehta Sweet Mart Production Database Engine Tuning
-- ====================================================================

-- Diagnostic helper: Check existing indexes before execution:
-- SELECT indexname, tablename, indexdef FROM pg_indexes WHERE schemaname = 'public';

-- 1. Orders Indexes (Composite & Unique)
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_number_unique ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_created ON public.orders(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status_composite ON public.orders(payment_status, shipment_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc ON public.orders(created_at DESC);

-- 2. Order Items Indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- 3. Invoices Indexes (Unique invoice_number)
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON public.invoices(order_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_number_unique ON public.invoices(invoice_number);

-- 4. Products Indexes (Partial Index for Active Catalog Items)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'is_active'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_products_category_slug_active ON public.products(category_slug) WHERE (is_active = true);
  ELSE
    CREATE INDEX IF NOT EXISTS idx_products_category_slug ON public.products(category_slug);
  END IF;
END $$;

-- 5. Conditional Table Indexes (WhatsApp Carts, OTP, User Profiles)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'whatsapp_carts') THEN
    CREATE INDEX IF NOT EXISTS idx_whatsapp_carts_phone ON public.whatsapp_carts(phone);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'otp_verifications') THEN
    CREATE INDEX IF NOT EXISTS idx_otp_mobile_verified_exp ON public.otp_verifications(mobile, verified, expires_at);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_addresses') THEN
    CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON public.user_addresses(user_id);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_profiles') THEN
    CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON public.user_profiles(phone);
  END IF;
END $$;

-- 6. Update Query Planner Statistics
-- NOTE: VACUUM must be run separately outside a transaction. Use ANALYZE here.
ANALYZE public.orders;
ANALYZE public.order_items;
ANALYZE public.invoices;
ANALYZE public.products;

-- 7. Validation Tips:
-- To check existing indexes: SELECT indexname, tablename, indexdef FROM pg_indexes WHERE schemaname = 'public';
-- To validate query plans:    EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 'your-uuid' ORDER BY created_at DESC LIMIT 20;
-- To VACUUM (run separately in pg_admin or maintenance window, NOT inside a transaction):
--   VACUUM ANALYZE public.orders;
