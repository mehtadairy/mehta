-- Migration to add 'role' column to public.customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'customer';
