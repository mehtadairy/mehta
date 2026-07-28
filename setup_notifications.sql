-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID,
    type TEXT DEFAULT 'system',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    worker_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow public read/write or service role access
CREATE POLICY "Allow all actions for service role" ON public.notifications
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Enable real-time replication for notifications and print statuses (if any)
alter publication supabase_realtime add table public.notifications;
