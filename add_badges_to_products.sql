-- SQL Migration Script: Add missing 'badges' column to products table
-- Run this query in the Supabase Dashboard SQL Editor (https://supabase.com/) for your project database.

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS badges text[] DEFAULT '{}'::text[];
