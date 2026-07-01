-- SQL Migration Script: Create 'workers' table and insert initial employee accounts.
-- Execute this query in the Supabase Dashboard SQL Editor (https://supabase.com/).

CREATE TABLE IF NOT EXISTS public.workers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL,
  branch text NOT NULL,
  phone_number text,
  password text NOT NULL, -- password pin or text password
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed initial test workers (if they do not already exist)
INSERT INTO public.workers (employee_id, name, role, branch, phone_number, password, status)
VALUES 
  ('worker01', 'Rajesh Kumar', 'Store Associate', 'Main Branch', '9876543210', 'password123', 'active'),
  ('worker02', 'Suresh Mehta', 'Cashier', 'Downtown Branch', '9876543211', 'password456', 'active')
ON CONFLICT (employee_id) DO NOTHING;
