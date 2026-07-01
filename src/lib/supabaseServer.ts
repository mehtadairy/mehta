import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
// WARNING: The service role key bypasses Row Level Security (RLS). 
// Use this ONLY on the server side in secure API routes.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key';

export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);
