-- ==============================================================================
-- DATABASE MIGRATION: CUSTOMER EMAIL VERIFICATION
-- ==============================================================================

-- 1. Add verification fields to the customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- 2. Create table to store secure, single-use, short-lived verification tokens
CREATE TABLE IF NOT EXISTS customer_email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
