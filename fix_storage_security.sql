-- Migration script to secure the Supabase Storage invoices bucket
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- 1. Make the invoices bucket private
UPDATE storage.buckets
SET public = false
WHERE id = 'invoices';

-- 2. Drop insecure public access policies
DROP POLICY IF EXISTS "Public Read Access on Invoices Bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert Access on Invoices Bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Access on Invoices Bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Access on Invoices Bucket" ON storage.objects;

-- 3. Create secure policies (Only allow service_role to manage, which bypasses RLS automatically. No public policies needed!)
-- Note: Customers will download their invoices securely via the authorized API route: /api/invoices/download
