-- ==============================================================================
-- FIX: ORDER NUMBER SEQUENCE GENERATION (RLS BYPASS)
-- ==============================================================================
-- Issue: The `get_next_order_number` function modifies `daily_order_sequences`.
-- However, when called by unauthenticated users or via the public anon key,
-- it gets blocked by Row Level Security (RLS) on `daily_order_sequences`, 
-- returning a 42501 Unauthorized error.
--
-- Solution: Add the `SECURITY DEFINER` modifier to the RPC function.
-- This tells PostgreSQL to execute the function with the privileges of the
-- user who *created* it (i.e. postgres/admin), rather than the user calling it.
-- This securely allows order number generation without exposing the underlying
-- sequence table to the public.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_next_order_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    today_str text;
    next_seq integer;
    result_order_number text;
BEGIN
    -- 1. Format today's date as YYMMDD
    today_str := to_char(CURRENT_DATE, 'YYMMDD');

    -- 2. Upsert (insert or update) the sequence for today
    INSERT INTO daily_order_sequences (date_prefix, last_sequence)
    VALUES (today_str, 1)
    ON CONFLICT (date_prefix)
    DO UPDATE SET last_sequence = daily_order_sequences.last_sequence + 1
    RETURNING last_sequence INTO next_seq;

    -- 3. Construct the order number: MD-YYMMDD-XXXX (e.g., MD-260808-0001)
    result_order_number := 'MD-' || today_str || '-' || lpad(next_seq::text, 4, '0');

    RETURN result_order_number;
END;
$$;
