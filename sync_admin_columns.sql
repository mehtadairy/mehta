-- Migration: Synchronize missing columns for Admin Dashboard (Orders)
-- Run these queries in your Supabase SQL Editor.

-- Payment Automation Columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS invoice_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS invoice_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS invoice_generated BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS invoice_sent BOOLEAN DEFAULT false;

-- Cancellation Columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancelled_by TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Print Station Columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS printed BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS print_status TEXT DEFAULT 'pending';

-- Refund feature (optional safety)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_refund_id TEXT;
