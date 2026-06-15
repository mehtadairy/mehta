-- Mehta Sweet Mart: Schema Expansion Updates
-- Run this in your Supabase SQL Editor

-- 1. Update Categories Table
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 2. Create Banners Table
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255),
    subtitle TEXT,
    image_url TEXT NOT NULL,
    button_text VARCHAR(100),
    button_link VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Create Customers Table
DROP TABLE IF EXISTS public.addresses CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Create Addresses Table
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    flat_no VARCHAR(100),
    house_no VARCHAR(100),
    company_name VARCHAR(255),
    area VARCHAR(255),
    street VARCHAR(255),
    sector VARCHAR(100),
    landmark VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(20) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Create Delivery Zones Table
DROP TABLE IF EXISTS public.delivery_zones CASCADE;
CREATE TABLE IF NOT EXISTS public.delivery_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pincode VARCHAR(20) UNIQUE NOT NULL,
    city VARCHAR(100),
    delivery_charge DECIMAL(10, 2) DEFAULT 0.00,
    estimated_days VARCHAR(50),
    free_delivery_above DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Create CMS Pages Table
CREATE TABLE IF NOT EXISTS public.cms_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;

-- CREATE RLS POLICIES

-- Banners: Anyone can read active banners. Admins bypass via Service Role.
DROP POLICY IF EXISTS "Enable read access for all users on active banners" ON public.banners;
CREATE POLICY "Enable read access for all users on active banners" 
ON public.banners FOR SELECT USING (true);

-- Customers: For now, allow public select/insert so our anon-key API can work until proper Auth.
DROP POLICY IF EXISTS "Enable public insert for customers" ON public.customers;
CREATE POLICY "Enable public insert for customers" 
ON public.customers FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable public select for customers" ON public.customers;
CREATE POLICY "Enable public select for customers" 
ON public.customers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable public update for customers" ON public.customers;
CREATE POLICY "Enable public update for customers" 
ON public.customers FOR UPDATE USING (true);

-- Addresses: Public access for now to support our custom OTP flow without Supabase Auth tokens.
DROP POLICY IF EXISTS "Enable public insert for addresses" ON public.addresses;
CREATE POLICY "Enable public insert for addresses" 
ON public.addresses FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable public select for addresses" ON public.addresses;
CREATE POLICY "Enable public select for addresses" 
ON public.addresses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable public update for addresses" ON public.addresses;
CREATE POLICY "Enable public update for addresses" 
ON public.addresses FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable public delete for addresses" ON public.addresses;
CREATE POLICY "Enable public delete for addresses" 
ON public.addresses FOR DELETE USING (true);

-- Delivery Zones: Public read.
DROP POLICY IF EXISTS "Enable read access for all users on delivery_zones" ON public.delivery_zones;
CREATE POLICY "Enable read access for all users on delivery_zones" 
ON public.delivery_zones FOR SELECT USING (true);

-- CMS Pages: Public read.
DROP POLICY IF EXISTS "Enable read access for all users on cms_pages" ON public.cms_pages;
CREATE POLICY "Enable read access for all users on cms_pages" 
ON public.cms_pages FOR SELECT USING (true);

-- Seed Initial Delivery Zones
INSERT INTO public.delivery_zones (pincode, city, delivery_charge, estimated_days, free_delivery_above) VALUES 
('360001', 'Rajkot', 0.00, 'Same Day', 500.00),
('380001', 'Ahmedabad', 50.00, '1-2 Days', 1000.00)
ON CONFLICT (pincode) DO NOTHING;

-- Seed Initial CMS Pages
INSERT INTO public.cms_pages (slug, title, content) VALUES
('privacy-policy', 'Privacy Policy', 'This is our default privacy policy content.'),
('terms-and-conditions', 'Terms & Conditions', 'These are our terms and conditions.'),
('refund-policy', 'Refund Policy', 'We offer refunds on damaged goods.')
ON CONFLICT (slug) DO NOTHING;
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'staff')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert a default super_admin
INSERT INTO public.admin_users (name, email, role)
VALUES ('Super Admin', 'admin@mehtasweetmart.com', 'super_admin')
ON CONFLICT (email) DO NOTHING;
-- Notifications Tables
CREATE TABLE IF NOT EXISTS public.email_templates (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), event_type VARCHAR(100) UNIQUE NOT NULL, subject VARCHAR(255) NOT NULL, html_body TEXT NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), event_type VARCHAR(100) UNIQUE NOT NULL, message_body TEXT NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.notification_logs (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), order_id VARCHAR(100), customer_phone VARCHAR(20), customer_email VARCHAR(255), type VARCHAR(50) CHECK (type IN ('email', 'whatsapp')), status VARCHAR(50) CHECK (status IN ('sent', 'failed', 'pending')), event_type VARCHAR(100), error_message TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());
-- Payments Tables
DROP TABLE IF EXISTS public.payments;
CREATE TABLE IF NOT EXISTS public.payments (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), order_id VARCHAR(100) NOT NULL, payment_id VARCHAR(100), razorpay_order_id VARCHAR(100), amount DECIMAL(10, 2) NOT NULL, method VARCHAR(50), status VARCHAR(50) DEFAULT 'pending', created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.refunds (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), order_id VARCHAR(100) NOT NULL, payment_id VARCHAR(100), refund_id VARCHAR(100), amount DECIMAL(10, 2) NOT NULL, status VARCHAR(50) DEFAULT 'processed', created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());
-- Backup Logs
CREATE TABLE IF NOT EXISTS public.backup_logs (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), backup_type VARCHAR(100) NOT NULL, status VARCHAR(50) DEFAULT 'success', file_url TEXT, created_by VARCHAR(255), created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());
-- Push Subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL, device_id VARCHAR(255), subscription_data JSONB NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());

-- ==========================================================
-- SUPABASE STORAGE BUCKET & RLS POLICIES FOR PRODUCT IMAGES
-- ==========================================================

-- 1. Insert 'products' bucket into storage.buckets if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products', 
  'products', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies on storage.objects for 'products' if any, to avoid conflicts
DROP POLICY IF EXISTS "Public Read Access on Products Bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert Access on Products Bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Access on Products Bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Access on Products Bucket" ON storage.objects;

-- 3. Create RLS Policies to allow public read/write access to 'products' bucket
CREATE POLICY "Public Read Access on Products Bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

CREATE POLICY "Public Insert Access on Products Bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'products');

CREATE POLICY "Public Update Access on Products Bucket"
ON storage.objects FOR UPDATE
USING (bucket_id = 'products');

CREATE POLICY "Public Delete Access on Products Bucket"
ON storage.objects FOR DELETE
USING (bucket_id = 'products');

-- Add ingredients column to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS ingredients jsonb DEFAULT '[]'::jsonb;

-- New Professional Food Information Fields
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shelf_life INTEGER DEFAULT 12;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS storage_instructions TEXT DEFAULT 'Store in a cool and dry place.';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS allergens JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS dietary_tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS highlights JSONB DEFAULT '[]'::jsonb;

-- Ingredients Management Table
CREATE TABLE IF NOT EXISTS public.ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Join table for Products and Ingredients
CREATE TABLE IF NOT EXISTS public.product_ingredients (
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, ingredient_id)
);

-- Enable RLS
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_ingredients ENABLE ROW LEVEL SECURITY;

-- Create public access policies for ingredients and product_ingredients
DROP POLICY IF EXISTS "Enable read access for all users on ingredients" ON public.ingredients;
CREATE POLICY "Enable read access for all users on ingredients" ON public.ingredients FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable all access for all users on ingredients" ON public.ingredients;
CREATE POLICY "Enable all access for all users on ingredients" ON public.ingredients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable read access for all users on product_ingredients" ON public.product_ingredients;
CREATE POLICY "Enable read access for all users on product_ingredients" ON public.product_ingredients FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable all access for all users on product_ingredients" ON public.product_ingredients;
CREATE POLICY "Enable all access for all users on product_ingredients" ON public.product_ingredients FOR ALL USING (true) WITH CHECK (true);
-- ==========================================================
-- ECOMMERCE EXPANSION: GOOGLE AUTH & DELIVERY ZONES
-- ==========================================================

-- 1. Modify customers table to support OAuth signups (making phone optional initially)
ALTER TABLE public.customers ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE public.customers ADD CONSTRAINT customers_email_key UNIQUE (email);

-- 2. Modify delivery_zones table to support lists of pincodes
ALTER TABLE public.delivery_zones DROP CONSTRAINT IF EXISTS delivery_zones_pincode_key;
ALTER TABLE public.delivery_zones ALTER COLUMN pincode DROP NOT NULL;
ALTER TABLE public.delivery_zones ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE public.delivery_zones ADD COLUMN IF NOT EXISTS pincodes TEXT;

-- Update existing records to match the new zone model
UPDATE public.delivery_zones 
SET name = COALESCE(city, 'Zone - ' || pincode), 
    pincodes = pincode 
WHERE pincodes IS NULL AND pincode IS NOT NULL;

-- Add write policy for admins on delivery_zones
DROP POLICY IF EXISTS "Enable all access for admins on delivery_zones" ON public.delivery_zones;
CREATE POLICY "Enable all access for admins on delivery_zones" 
ON public.delivery_zones FOR ALL USING (true) WITH CHECK (true);

