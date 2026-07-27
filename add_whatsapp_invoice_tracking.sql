-- SQL Migration: Add WhatsApp Invoice Tracking Columns
-- Run these queries in your Supabase SQL Editor.

-- 1. Add columns to public.orders if they do not exist
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS invoice_sent_at timestamp with time zone;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS whatsapp_message_id text;

-- 2. Add columns to public.invoices if they do not exist
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS invoice_sent boolean DEFAULT false;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS invoice_sent_at timestamp with time zone;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS whatsapp_message_id text;
