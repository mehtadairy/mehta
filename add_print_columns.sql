-- Phase 1: Print Columns and Logs Migration (v2)
-- Run this in your Supabase SQL Editor

-- 1. Add print columns to the orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS printed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS printed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS printed_by TEXT,
ADD COLUMN IF NOT EXISTS print_status TEXT DEFAULT 'pending';

-- 2. Create public.print_jobs table for realtime queueing
CREATE TABLE IF NOT EXISTS public.print_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    branch_id TEXT NOT NULL,
    target_printer TEXT NOT NULL, -- e.g., 'billing', 'kitchen', 'packing'
    status TEXT DEFAULT 'pending', -- 'pending', 'printed', 'failed'
    esc_pos_data TEXT, -- Hex encoded ESC/POS data
    error_message TEXT,
    retries INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create public.printer_settings table (used for heartbeats & config)
CREATE TABLE IF NOT EXISTS public.printer_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch TEXT UNIQUE DEFAULT 'Main',
    selected_printer TEXT DEFAULT '',
    paper_width TEXT DEFAULT '80mm',
    auto_print_enabled BOOLEAN DEFAULT TRUE,
    print_copies INTEGER DEFAULT 1,
    print_kitchen_receipt BOOLEAN DEFAULT TRUE,
    print_packing_slip BOOLEAN DEFAULT TRUE,
    auto_retry BOOLEAN DEFAULT TRUE,
    status TEXT DEFAULT 'offline',
    installed_printers JSONB DEFAULT '[]'::jsonb,
    last_seen TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.print_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.printer_settings ENABLE ROW LEVEL SECURITY;

-- 5. Enable public policies: select/insert/update/delete for simple anonymous system access
DROP POLICY IF EXISTS "Enable public select for print_jobs" ON public.print_jobs;
CREATE POLICY "Enable public select for print_jobs" ON public.print_jobs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable public insert for print_jobs" ON public.print_jobs;
CREATE POLICY "Enable public insert for print_jobs" ON public.print_jobs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable public update for print_jobs" ON public.print_jobs;
CREATE POLICY "Enable public update for print_jobs" ON public.print_jobs FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable public delete for print_jobs" ON public.print_jobs;
CREATE POLICY "Enable public delete for print_jobs" ON public.print_jobs FOR DELETE USING (true);

DROP POLICY IF EXISTS "Enable public select for printer_settings" ON public.printer_settings;
CREATE POLICY "Enable public select for printer_settings" ON public.printer_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable public update for printer_settings" ON public.printer_settings;
CREATE POLICY "Enable public update for printer_settings" ON public.printer_settings FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable public insert for printer_settings" ON public.printer_settings;
CREATE POLICY "Enable public insert for printer_settings" ON public.printer_settings FOR INSERT WITH CHECK (true);

-- 6. Populate default configuration setting row
INSERT INTO public.printer_settings (branch, selected_printer, paper_width)
VALUES ('Main', '', '80mm')
ON CONFLICT (branch) DO NOTHING;

-- 7. Create replication publication for realtime print_jobs
BEGIN;
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
      CREATE PUBLICATION supabase_realtime;
    END IF;
  END
  $$;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.print_jobs;
COMMIT;
