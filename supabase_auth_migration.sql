-- Migration script for MSG91 Authentication Integration

-- 1. Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone VARCHAR(15) UNIQUE NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Modify or create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    total DECIMAL(10,2) NOT NULL,
    delivery_charge DECIMAL(10,2) DEFAULT 0,
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'Pending',
    items JSONB NOT NULL,
    shipping_address JSONB,
    billing_address JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create Policies (Adjust as per actual security requirements)
CREATE POLICY "Customers can view their own profile" 
    ON public.customers FOR SELECT 
    USING (true); -- In a real app, use auth.uid() or verify via API

CREATE POLICY "Customers can insert their profile" 
    ON public.customers FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Customers can update their own profile" 
    ON public.customers FOR UPDATE 
    USING (true);

-- Orders policies
CREATE POLICY "Orders are viewable by everyone" 
    ON public.orders FOR SELECT 
    USING (true);

CREATE POLICY "Orders can be inserted" 
    ON public.orders FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Orders can be updated" 
    ON public.orders FOR UPDATE 
    USING (true);
