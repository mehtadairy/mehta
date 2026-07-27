-- Migration script to add missing columns to public.customers table
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- 1. Add auth_user_id column (links to Supabase auth.users)
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE;

-- 2. Add auth_provider column (stores login method)
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50);

-- 3. Add phone_verified column
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;

-- 4. Add profile_image / avatar_url columns
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS profile_image TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 5. Create email_otps table for email verification
CREATE TABLE IF NOT EXISTS public.email_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    otp_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INT DEFAULT 0,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for lookup
CREATE INDEX IF NOT EXISTS idx_email_otps_lookup ON public.email_otps (email, used);

-- Enable RLS and public policies
ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for public" ON public.email_otps;
CREATE POLICY "Enable insert for public" ON public.email_otps FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable select for public" ON public.email_otps;
CREATE POLICY "Enable select for public" ON public.email_otps FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable update for public" ON public.email_otps;
CREATE POLICY "Enable update for public" ON public.email_otps FOR UPDATE USING (true);

