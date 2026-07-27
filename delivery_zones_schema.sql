-- Migration to create the new delivery_zones table structure
-- Execute this block inside your Supabase Dashboard SQL Editor

CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pincode TEXT UNIQUE NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  delivery_charge NUMERIC NOT NULL DEFAULT 0,
  minimum_order NUMERIC NOT NULL DEFAULT 0,
  free_delivery_above NUMERIC,
  estimated_delivery_time TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS) and allow read access to public
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.delivery_zones
  FOR SELECT USING (true);

CREATE POLICY "Enable all actions for admin role" ON public.delivery_zones
  USING (true)
  WITH CHECK (true);
