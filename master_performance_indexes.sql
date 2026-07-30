-- ====================================================================
-- MASTER PERFORMANCE & INDEX OPTIMIZATION MIGRATION
-- Mehta Sweet Mart Production Database Engine Tuning
-- ====================================================================

-- 1. Orders Indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status_composite ON public.orders(payment_status, shipment_status);

-- 2. Order Items Indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- 3. Invoices Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON public.invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);

-- 4. Products Indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_active_sort ON public.products(is_active, display_order ASC);

-- 5. WhatsApp & Cart Indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_carts_phone ON public.whatsapp_carts(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_otp_phone ON public.whatsapp_otp(phone_number, created_at DESC);

-- 6. User Profiles & Addresses Indexes
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON public.user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON public.user_profiles(phone);

-- 7. Analyze tables to update query planner statistics
ANALYZE public.orders;
ANALYZE public.order_items;
ANALYZE public.invoices;
ANALYZE public.products;
ANALYZE public.whatsapp_carts;
