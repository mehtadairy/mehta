-- Blog Articles Schema Updates
-- Copy and run these SQL statements in your Supabase SQL Editor

-- 1. Create public.blogs table
CREATE TABLE IF NOT EXISTS public.blogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'heritage', -- heritage, recipes, culture, gifting
    image TEXT,
    author TEXT NOT NULL DEFAULT 'Mehta Dairy',
    read_time VARCHAR(50) NOT NULL DEFAULT '5 min read',
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- 3. Public access policies
DROP POLICY IF EXISTS "Public select access for blogs" ON public.blogs;
CREATE POLICY "Public select access for blogs" ON public.blogs 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert access for blogs" ON public.blogs;
CREATE POLICY "Public insert access for blogs" ON public.blogs 
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update access for blogs" ON public.blogs;
CREATE POLICY "Public update access for blogs" ON public.blogs 
FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public delete access for blogs" ON public.blogs;
CREATE POLICY "Public delete access for blogs" ON public.blogs 
FOR DELETE USING (true);
