-- Invoices and Invoice Email Logs Schema
-- Run this in your Supabase SQL Editor

-- 1. Create public.invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Create public.invoice_email_logs table
CREATE TABLE IF NOT EXISTS public.invoice_email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
    customer_email VARCHAR(255) NOT NULL,
    email_sent BOOLEAN DEFAULT false NOT NULL,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    email_status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS on invoices and logs
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_email_logs ENABLE ROW LEVEL SECURITY;

-- 4. Enable policies: public select/insert/update/delete for anonymous client operations
DROP POLICY IF EXISTS "Enable public select for invoices" ON public.invoices;
CREATE POLICY "Enable public select for invoices" ON public.invoices FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable public insert for invoices" ON public.invoices;
CREATE POLICY "Enable public insert for invoices" ON public.invoices FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable public update for invoices" ON public.invoices;
CREATE POLICY "Enable public update for invoices" ON public.invoices FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable public delete for invoices" ON public.invoices;
CREATE POLICY "Enable public delete for invoices" ON public.invoices FOR DELETE USING (true);

DROP POLICY IF EXISTS "Enable public select for invoice_email_logs" ON public.invoice_email_logs;
CREATE POLICY "Enable public select for invoice_email_logs" ON public.invoice_email_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable public insert for invoice_email_logs" ON public.invoice_email_logs;
CREATE POLICY "Enable public insert for invoice_email_logs" ON public.invoice_email_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable public update for invoice_email_logs" ON public.invoice_email_logs;
CREATE POLICY "Enable public update for invoice_email_logs" ON public.invoice_email_logs FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable public delete for invoice_email_logs" ON public.invoice_email_logs;
CREATE POLICY "Enable public delete for invoice_email_logs" ON public.invoice_email_logs FOR DELETE USING (true);

-- 5. Create storage bucket for invoice pdfs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoices', 
  'invoices', 
  true, 
  10485760, -- 10MB limit
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 6. Setup storage policies for invoices bucket
DROP POLICY IF EXISTS "Public Read Access on Invoices Bucket" ON storage.objects;
CREATE POLICY "Public Read Access on Invoices Bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'invoices');

DROP POLICY IF EXISTS "Public Insert Access on Invoices Bucket" ON storage.objects;
CREATE POLICY "Public Insert Access on Invoices Bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'invoices');

DROP POLICY IF EXISTS "Public Update Access on Invoices Bucket" ON storage.objects;
CREATE POLICY "Public Update Access on Invoices Bucket"
ON storage.objects FOR UPDATE
USING (bucket_id = 'invoices');

DROP POLICY IF EXISTS "Public Delete Access on Invoices Bucket" ON storage.objects;
CREATE POLICY "Public Delete Access on Invoices Bucket"
ON storage.objects FOR DELETE
USING (bucket_id = 'invoices');
