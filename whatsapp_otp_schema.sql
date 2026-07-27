-- Run this in your Supabase SQL Editor to create the OTP verifications table

CREATE TABLE IF NOT EXISTS otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile VARCHAR(20) NOT NULL,
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INT DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup by mobile and unverified status
CREATE INDEX IF NOT EXISTS idx_otp_mobile_verified ON otp_verifications (mobile, verified);

-- Enable Row Level Security (RLS) but allow public access for API routes
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable insert for public" ON otp_verifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for public" ON otp_verifications FOR SELECT USING (true);
CREATE POLICY "Enable update for public" ON otp_verifications FOR UPDATE USING (true);
