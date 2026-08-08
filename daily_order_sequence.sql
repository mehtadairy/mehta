-- ==============================================================================
-- Mehta Dairy: Daily Order Sequence Migration
-- Creates a concurrency-safe, daily order numbering system.
-- Format: MD-YYMMDD-XXXX
-- ==============================================================================

-- 1. Create the sequence table
CREATE TABLE IF NOT EXISTS daily_order_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_date DATE UNIQUE NOT NULL,
    last_number INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create index on order_date for fast lookups
CREATE INDEX IF NOT EXISTS idx_daily_order_sequences_date ON daily_order_sequences(order_date);

-- 3. Create the concurrency-safe function
CREATE OR REPLACE FUNCTION get_next_order_number()
RETURNS TEXT AS $$
DECLARE
    today_date DATE;
    current_number INTEGER;
    formatted_date TEXT;
    formatted_number TEXT;
BEGIN
    -- Determine today's date in Asia/Kolkata timezone
    today_date := (now() AT TIME ZONE 'Asia/Kolkata')::DATE;
    
    -- Format date as YYMMDD
    formatted_date := to_char(today_date, 'YYMMDD');

    -- Atomically increment or insert the sequence for today
    INSERT INTO daily_order_sequences (order_date, last_number, created_at, updated_at)
    VALUES (today_date, 1, now(), now())
    ON CONFLICT (order_date) 
    DO UPDATE SET 
        last_number = daily_order_sequences.last_number + 1,
        updated_at = now()
    RETURNING last_number INTO current_number;

    -- Format the sequence number as 4 digits, zero-padded (XXXX)
    formatted_number := lpad(current_number::TEXT, 4, '0');

    -- Return the final formatted string
    RETURN 'MD-' || formatted_date || '-' || formatted_number;
END;
$$ LANGUAGE plpgsql VOLATILE;
