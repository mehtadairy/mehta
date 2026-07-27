-- 1. Order Sequences Table (Atomic Counter)
CREATE TABLE IF NOT EXISTS order_sequences (
    id VARCHAR(50) PRIMARY KEY,
    current_value BIGINT NOT NULL DEFAULT 0
);

INSERT INTO order_sequences (id, current_value) VALUES ('ORD', 0) ON CONFLICT DO NOTHING;

-- 2. Function to atomically get the next order number
CREATE OR REPLACE FUNCTION get_next_order_number()
RETURNS TEXT AS $$
DECLARE
    next_val BIGINT;
BEGIN
    UPDATE order_sequences
    SET current_value = current_value + 1
    WHERE id = 'ORD'
    RETURNING current_value INTO next_val;
    
    RETURN 'ORD-' || LPAD(next_val::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- 3. Payment Recovery Table
CREATE TABLE IF NOT EXISTS payment_recovery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id VARCHAR(100) NOT NULL UNIQUE,
    razorpay_order_id VARCHAR(100),
    amount INTEGER,
    customer JSONB,
    payload JSONB,
    status VARCHAR(50) DEFAULT 'pending', -- pending, recovered, failed, refunded
    failure_reason TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Migration for existing orders
DO $$ 
DECLARE 
    r RECORD;
    cnt BIGINT := 1;
BEGIN
    -- Update existing orders to sequential numbers based on creation date
    FOR r IN (SELECT id FROM orders ORDER BY created_at ASC) LOOP
        UPDATE orders SET order_number = 'ORD-' || LPAD(cnt::TEXT, 6, '0') WHERE id = r.id;
        cnt := cnt + 1;
    END LOOP;
    
    -- Sync sequence table with current max
    UPDATE order_sequences SET current_value = cnt - 1 WHERE id = 'ORD';
END $$;

-- 5. Add UNIQUE constraint to order_number safely
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'orders_order_number_key'
    ) THEN
        ALTER TABLE orders ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);
    END IF;
END $$;
