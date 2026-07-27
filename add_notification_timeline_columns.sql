-- Phase: Notifications and Timeline

-- 1. Create whatsapp_notification_logs
CREATE TABLE IF NOT EXISTS public.whatsapp_notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    phone TEXT,
    notification_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create order_timeline_events
CREATE TABLE IF NOT EXISTS public.order_timeline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. RLS Policies
ALTER TABLE public.whatsapp_notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_timeline_events ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access to timeline if they have the order ID (similar to tracking)
CREATE POLICY "Public can view order timeline if they have order ID" 
ON public.order_timeline_events FOR SELECT USING (true);

-- Backend can do everything (Service Role bypasses RLS)
