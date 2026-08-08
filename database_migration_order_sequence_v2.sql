-- ==============================================================================
-- SEQUENTIAL ORDER NUMBER GENERATION MIGRATION
-- ==============================================================================
-- Issue: Order numbers were generated with a random/timestamp suffix if the
-- sequence table had permission issues, resulting in MD-YYMMDD-5982 instead
-- of strict MD-YYMMDD-0001 sequences.
-- 
-- Solution: 
-- 1. Create a dedicated `order_number_counters` table with a DATE primary key.
-- 2. Add a UNIQUE index to `orders.order_number`.
-- 3. Update `get_next_order_number()` to use atomic INSERT ... ON CONFLICT DO UPDATE.
-- 4. Limit the sequence to 9999 and raise an exception if exceeded.
-- ==============================================================================

-- 1. Create the atomic counter table
CREATE TABLE IF NOT EXISTS public.order_number_counters (
    date_key DATE PRIMARY KEY,
    last_number INTEGER NOT NULL DEFAULT 0
);

-- Protect the counter table from direct public access
ALTER TABLE public.order_number_counters ENABLE ROW LEVEL SECURITY;

-- 2. Ensure orders.order_number is strictly unique at the database level
CREATE UNIQUE INDEX IF NOT EXISTS unique_order_number ON public.orders(order_number);

-- 3. Replace the sequence generator function
CREATE OR REPLACE FUNCTION public.get_next_order_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    today_date DATE;
    today_str text;
    next_seq integer;
    result_order_number text;
BEGIN
    -- Use CURRENT_DATE for the sequence boundary
    today_date := CURRENT_DATE;
    
    -- Format date as YYMMDD (e.g. 260808)
    today_str := to_char(today_date, 'YYMMDD');

    -- Atomic upsert to get the strictly sequential next number
    INSERT INTO public.order_number_counters (date_key, last_number)
    VALUES (today_date, 1)
    ON CONFLICT (date_key)
    DO UPDATE SET last_number = order_number_counters.last_number + 1
    RETURNING last_number INTO next_seq;

    -- Strict 4-digit limit enforcement (0001 -> 9999)
    IF next_seq > 9999 THEN
        RAISE EXCEPTION 'Daily order limit exceeded (9999 orders). Cannot generate next order number securely.';
    END IF;

    -- Construct the final order number: MD-YYMMDD-XXXX
    result_order_number := 'MD-' || today_str || '-' || lpad(next_seq::text, 4, '0');

    RETURN result_order_number;
END;
$$;
