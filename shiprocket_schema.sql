-- Supabase SQL Migration for Shiprocket Integration

-- 1. Table for Shiprocket Auth Token & Config Caching
CREATE TABLE IF NOT EXISTS public.shiprocket_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  refreshed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Enable RLS & set policies for shiprocket_config
ALTER TABLE public.shiprocket_config ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'shiprocket_config' AND policyname = 'Enable all access for service role on shiprocket_config'
  ) THEN
    CREATE POLICY "Enable all access for service role on shiprocket_config" ON public.shiprocket_config FOR ALL USING (true);
  END IF;
END $$;


-- 2. Table for Detailed Shiprocket Shipments
CREATE TABLE IF NOT EXISTS public.shiprocket_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  shiprocket_order_id BIGINT,
  shipment_id BIGINT,
  courier_id INT,
  courier_name TEXT,
  awb_number TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  pickup_status INT DEFAULT 0,
  pickup_scheduled_date TEXT,
  label_url TEXT,
  manifest_url TEXT,
  invoice_url TEXT,
  current_shipment_status TEXT DEFAULT 'NEW',
  delivery_eta TEXT,
  rto_awb TEXT,
  return_shipment_id BIGINT,
  return_awb TEXT,
  return_status TEXT,
  raw_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index on order_id & awb_number
CREATE INDEX IF NOT EXISTS idx_shiprocket_shipments_order_id ON public.shiprocket_shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shiprocket_shipments_awb_number ON public.shiprocket_shipments(awb_number);

-- Enable RLS on shiprocket_shipments
ALTER TABLE public.shiprocket_shipments ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'shiprocket_shipments' AND policyname = 'Enable read access for authenticated users'
  ) THEN
    CREATE POLICY "Enable read access for authenticated users" ON public.shiprocket_shipments FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'shiprocket_shipments' AND policyname = 'Enable all access for service role on shiprocket_shipments'
  ) THEN
    CREATE POLICY "Enable all access for service role on shiprocket_shipments" ON public.shiprocket_shipments FOR ALL USING (true);
  END IF;
END $$;


-- 3. Table for Shipping Audit Logs
CREATE TABLE IF NOT EXISTS public.shipping_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT,
  action TEXT NOT NULL,
  request_payload JSONB,
  response_payload JSONB,
  status TEXT NOT NULL DEFAULT 'SUCCESS',
  error_message TEXT,
  retry_count INT DEFAULT 0,
  admin_user TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index on shipping_logs
CREATE INDEX IF NOT EXISTS idx_shipping_logs_order_id ON public.shipping_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_shipping_logs_action ON public.shipping_logs(action);

-- Enable RLS on shipping_logs
ALTER TABLE public.shipping_logs ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'shipping_logs' AND policyname = 'Enable all access for service role on shipping_logs'
  ) THEN
    CREATE POLICY "Enable all access for service role on shipping_logs" ON public.shipping_logs FOR ALL USING (true);
  END IF;
END $$;


-- 4. Add Shiprocket Columns directly to `orders` table for fast querying
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shiprocket_order_id BIGINT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipment_id BIGINT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS awb_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_id INT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipment_status TEXT DEFAULT 'Pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_eta TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_label_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS manifest_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_scheduled_at TIMESTAMP WITH TIME ZONE;
