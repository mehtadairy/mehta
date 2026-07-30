-- ====================================================================
-- SECURE DATABASE ROW LEVEL SECURITY (RLS) POLICIES
-- Run this in your Supabase SQL Editor to block anonymous access to orders/customers
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. Enable RLS on all tables (especially order_items which was fully open)
-- --------------------------------------------------------------------
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_recovery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_accounts ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------
-- 2. Secure Customers Table
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read access on customers" ON public.customers;
DROP POLICY IF EXISTS "Allow public insert access on customers" ON public.customers;
DROP POLICY IF EXISTS "Allow public update access on customers" ON public.customers;

-- Authenticated customers can read their own profile
CREATE POLICY "Allow customers to read their own profile"
ON public.customers
FOR SELECT
USING (auth.uid() = id);

-- Authenticated customers can update their own profile
CREATE POLICY "Allow customers to update their own profile"
ON public.customers
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow server side service_role/staff all access
CREATE POLICY "Allow staff all access on customers"
ON public.customers
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.staff_accounts
    WHERE auth.uid() = id AND role IN ('Administrator', 'Store Manager')
  )
);

-- --------------------------------------------------------------------
-- 3. Secure Orders Table
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read access on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public insert access on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public update access on orders" ON public.orders;

-- Owner read check
CREATE POLICY "Allow owners to read their own orders"
ON public.orders
FOR SELECT
USING (auth.uid() = customer_id);

-- Owner insert check (allow null customer_id for guest checkout if handled securely in API)
CREATE POLICY "Allow owners to insert their own orders"
ON public.orders
FOR INSERT
WITH CHECK (auth.uid() = customer_id OR customer_id IS NULL);

-- Owner update check (restrict cancels to Pending state only)
CREATE POLICY "Allow owners to cancel their own orders"
ON public.orders
FOR UPDATE
USING (auth.uid() = customer_id)
WITH CHECK (auth.uid() = customer_id AND status = 'Pending');

-- Staff/Admin all access on orders
CREATE POLICY "Allow staff all access on orders"
ON public.orders
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.staff_accounts
    WHERE auth.uid() = id AND role IN ('Administrator', 'Store Manager')
  )
);

-- --------------------------------------------------------------------
-- 4. Secure Order Items Table
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read access on order_items" ON public.order_items;
DROP POLICY IF EXISTS "Allow public insert access on order_items" ON public.order_items;

-- Owner select check
CREATE POLICY "Allow owners to read their own order items"
ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id AND auth.uid() = orders.customer_id
  )
);

-- Owner insert check
CREATE POLICY "Allow owners to insert their own order items"
ON public.order_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id AND auth.uid() = orders.customer_id
  )
);

-- Staff/Admin all access on order_items
CREATE POLICY "Allow staff all access on order_items"
ON public.order_items
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.staff_accounts
    WHERE auth.uid() = id AND role IN ('Administrator', 'Store Manager')
  )
);

-- --------------------------------------------------------------------
-- 5. Secure Payments Table
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read access on payments" ON public.payments;
DROP POLICY IF EXISTS "Allow public insert access on payments" ON public.payments;

CREATE POLICY "Allow owners to read their own payments"
ON public.payments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = payments.order_id AND auth.uid() = orders.customer_id
  )
);

CREATE POLICY "Allow staff all access on payments"
ON public.payments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.staff_accounts
    WHERE auth.uid() = id AND role IN ('Administrator', 'Store Manager')
  )
);
