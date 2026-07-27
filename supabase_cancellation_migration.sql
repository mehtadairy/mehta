-- Migration script for Customer Self-Cancellation System

-- 1. Add cancellation tracking columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS cancelled_by TEXT,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- 2. Create order_cancellations audit table
CREATE TABLE IF NOT EXISTS order_cancellations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL,
    customer_id UUID, -- Can be null if guest
    cancelled_by TEXT NOT NULL, -- 'Customer' or 'Admin'
    reason TEXT,
    ip_address TEXT,
    device TEXT,
    refund_status TEXT, -- 'N/A', 'Requested', 'Completed', 'Rejected'
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);
