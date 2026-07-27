-- SQL Migration Script: Add 'source' column to orders table
-- Execute this query in the Supabase Dashboard SQL Editor (https://supabase.com/).

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS source text DEFAULT 'website';
