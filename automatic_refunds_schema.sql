-- Migration: Automatic Order Cancellation + Razorpay Refund System Hardening for Mehta Dairy

CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_id TEXT NOT NULL,
    razorpay_refund_id TEXT,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'PENDING',
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    processed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    failure_reason TEXT,
    reversed_at TIMESTAMPTZ,
    reversal_reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Safe migrations for existing tables
ALTER TABLE refunds ADD COLUMN IF NOT EXISTS razorpay_refund_id TEXT;
ALTER TABLE refunds ADD COLUMN IF NOT EXISTS amount NUMERIC;
ALTER TABLE refunds ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';
ALTER TABLE refunds ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE refunds ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE refunds ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;
ALTER TABLE refunds ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ;
ALTER TABLE refunds ADD COLUMN IF NOT EXISTS failure_reason TEXT;
ALTER TABLE refunds ADD COLUMN IF NOT EXISTS reversed_at TIMESTAMPTZ;
ALTER TABLE refunds ADD COLUMN IF NOT EXISTS reversal_reason TEXT;
ALTER TABLE refunds ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS refunds_order_id_idx ON refunds(order_id);
CREATE INDEX IF NOT EXISTS refunds_payment_id_idx ON refunds(payment_id);
CREATE INDEX IF NOT EXISTS refunds_razorpay_refund_id_idx ON refunds(razorpay_refund_id);

-- Unique index to prevent duplicate active/full refunds for the same order/payment
CREATE UNIQUE INDEX IF NOT EXISTS refunds_active_order_idx ON refunds (order_id) WHERE status IN ('PENDING', 'PROCESSED');

-- Row Level Security
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable read access for service role' AND tablename = 'refunds') THEN
        CREATE POLICY "Enable read access for service role" ON refunds FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable insert access for service role' AND tablename = 'refunds') THEN
        CREATE POLICY "Enable insert access for service role" ON refunds FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable update access for service role' AND tablename = 'refunds') THEN
        CREATE POLICY "Enable update access for service role" ON refunds FOR UPDATE USING (true);
    END IF;
END $$;
