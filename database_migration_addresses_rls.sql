-- ==============================================================================
-- FIX: ADDRESSES TABLE ROW LEVEL SECURITY (RLS)
-- ==============================================================================
-- Issue: The `addresses` table was missing RLS policies, meaning anyone could 
-- potentially read or write addresses if they knew a customer_id.
--
-- Solution: Enable RLS and add strict policies to ensure customers can only
-- read, insert, update, or delete their own addresses.
-- ==============================================================================

-- 1. Enable RLS on the addresses table
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Allow customers to read their own addresses
CREATE POLICY "Enable read for users based on customer_id"
ON addresses FOR SELECT
TO authenticated
USING (
  customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  )
);

-- 3. Policy: Allow customers to insert their own addresses
CREATE POLICY "Enable insert for users based on customer_id"
ON addresses FOR INSERT
TO authenticated
WITH CHECK (
  customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  )
);

-- 4. Policy: Allow customers to update their own addresses
CREATE POLICY "Enable update for users based on customer_id"
ON addresses FOR UPDATE
TO authenticated
USING (
  customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  )
);

-- 5. Policy: Allow customers to delete their own addresses
CREATE POLICY "Enable delete for users based on customer_id"
ON addresses FOR DELETE
TO authenticated
USING (
  customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  )
);
