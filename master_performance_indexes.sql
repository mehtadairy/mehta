-- ====================================================================
-- MASTER PERFORMANCE & INDEX OPTIMIZATION MIGRATION (DBA REFINED)
-- Mehta Sweet Mart Production Database Engine Tuning
-- ====================================================================

-- 1. Orders Indexes (Composite & Unique)
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_number_unique ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_created ON public.orders(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status_composite ON public.orders(payment_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc ON public.orders(created_at DESC);

-- 2. Order Items Indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- 3. Customers & Addresses Indexes
CREATE INDEX IF NOT EXISTS idx_customers_auth_user_id ON public.customers(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_addresses_customer_id ON public.addresses(customer_id);

-- 4. Payments & Invoices Indexes
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON public.invoices(order_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_number_unique ON public.invoices(invoice_number);

-- 5. Products & Categories Indexes
CREATE INDEX IF NOT EXISTS idx_products_category_slug ON public.products(category_slug);
CREATE INDEX IF NOT EXISTS idx_products_position ON public.products(position);

-- 6. Delivery Zones & Notification Logs Indexes
CREATE INDEX IF NOT EXISTS idx_delivery_zones_pincode ON public.delivery_zones(pincode);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON public.notification_logs(created_at DESC);

-- 7. Conditional Table Indexes (WhatsApp Carts, OTP)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'whatsapp_carts') THEN
    CREATE INDEX IF NOT EXISTS idx_whatsapp_carts_phone ON public.whatsapp_carts(phone);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'otp_verifications') THEN
    CREATE INDEX IF NOT EXISTS idx_otp_mobile_verified_exp ON public.otp_verifications(mobile, verified, expires_at);
  END IF;
END $$;

-- 8. Update Query Planner Statistics
ANALYZE public.orders;
ANALYZE public.order_items;
ANALYZE public.customers;
ANALYZE public.addresses;
ANALYZE public.invoices;
ANALYZE public.products;
ANALYZE public.delivery_zones;
