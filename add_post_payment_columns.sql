-- SQL Migration: Post-Payment Automation Columns
-- Run these queries in your Supabase SQL Editor.

-- 1. Add post-payment columns to public.orders if they do not exist
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS invoice_number text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS invoice_url text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_completed_at timestamp with time zone;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notification_sent boolean DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS invoice_generated boolean DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS invoice_sent boolean DEFAULT false;

-- 2. Create the invoices storage bucket if it does not exist
-- Note: Storage buckets are usually managed via the Supabase Dashboard, 
-- but this SQL provides a reference for programmatic creation:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', true) ON CONFLICT (id) DO NOTHING;
