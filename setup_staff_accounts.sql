-- 1. Create the staff_accounts table
CREATE TABLE IF NOT EXISTS public.staff_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    role TEXT NOT NULL,
    branch TEXT DEFAULT 'Main Branch',
    permissions JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'Active',
    last_login TIMESTAMPTZ,
    login_history JSONB DEFAULT '[]'::jsonb,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by TEXT
);

-- Enable Row Level Security (optional, or disable so secure API routes can bypass)
ALTER TABLE public.staff_accounts ENABLE ROW LEVEL SECURITY;

-- Create policy for Admin/Service Role to do everything
CREATE POLICY "Allow all actions for service role" ON public.staff_accounts
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 2. Populate default staff members with pre-hashed credentials:
-- 'aryan' password is 'aryan123'
-- 'babli' password is 'babli@1972'

INSERT INTO public.staff_accounts (
    full_name, 
    username, 
    password_hash, 
    phone, 
    email, 
    role, 
    branch, 
    status, 
    permissions
) VALUES 
(
    'Aryan Rathod', 
    'aryan', 
    '10a2be97fa420ec64e4e2ccc26d7e82c:45a8f20b8240c9cf7656f98f2a17292c05aecd75f3a46b123987afe2ce2433a6200f7831a31993c457e217fd4a0ef3705a78b8e0009459a915d3034fdee164a4', 
    '9316688014', 
    'aryan@mehtadairy.com', 
    'Administrator', 
    'Main Branch', 
    'Active', 
    '["ALL"]'::jsonb
),
(
    'Babli Mehta', 
    'babli', 
    '33d0faeea620689b890a6b740d844a7a:d4435adb7683690eeceea4f50f7baf0fe79538fa61de25a5f8b2bacc1e9ffeb52c3e9e5f4465fca6e0c46723ab54dc2c41c62895884364f2bbce2bdf68635044', 
    '9876543212', 
    'babli@mehtadairy.com', 
    'Store Manager', 
    'Main Branch', 
    'Active', 
    '["dashboard", "orders", "whatsapp_orders", "invoices", "customers", "reports"]'::jsonb
)
ON CONFLICT (username) DO NOTHING;
