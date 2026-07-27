-- WhatsApp Templates Table
CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_name VARCHAR(100) NOT NULL UNIQUE,
    aisensy_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Upgrade existing whatsapp_logs if needed, or create new notification_logs
-- Let's just create a new notification_logs for clarity and better structure
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) NOT NULL,
    event_name VARCHAR(100) NOT NULL,
    template_name VARCHAR(100),
    payload JSONB,
    status VARCHAR(50) DEFAULT 'pending', -- pending, sent, delivered, failed
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Abandoned Carts Table (to track when someone starts checkout but doesn't finish)
CREATE TABLE IF NOT EXISTS abandoned_carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    phone VARCHAR(20),
    cart_data JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'abandoned', -- abandoned, recovered, ignored
    last_active TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Marketing Campaigns
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    template_id UUID REFERENCES whatsapp_templates(id),
    audience_type VARCHAR(50), -- all, recent, active
    status VARCHAR(50) DEFAULT 'draft', -- draft, running, completed
    sent_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insert Default Templates
INSERT INTO whatsapp_templates (event_name, aisensy_name, description) VALUES
('customer_registration', 'welcome_message', 'Sent when a new user signs up'),
('order_confirmation', 'order_confirmation', 'Sent when an order is successfully placed'),
('payment_success', 'payment_received', 'Sent on successful razorpay payment'),
('cod_confirmation', 'cod_order_placed', 'Sent for Cash on Delivery orders'),
('status_preparing', 'order_preparing', 'Order status changed to Preparing'),
('status_packed', 'order_packed', 'Order status changed to Packed'),
('status_out_delivery', 'order_out_delivery', 'Order status changed to Out for Delivery'),
('status_delivered', 'order_delivered', 'Order status changed to Delivered'),
('feedback_request', 'customer_feedback', 'Sent 2 hours after delivery'),
('reorder_reminder', 'reorder_reminder', 'Sent 30 days after purchase'),
('abandoned_cart', 'abandoned_cart', 'Sent 2 hours after cart abandonment'),
('birthday_wishes', 'birthday_wishes', 'Sent on customer birthday')
ON CONFLICT (event_name) DO NOTHING;
