import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
// WARNING: The service role key bypasses Row Level Security (RLS). 
// Use this ONLY on the server side in secure API routes.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key';

// Legacy standard client for server-side scripts (bypasses RLS)
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);

// SSR-compatible Server Client for Authentication (@supabase/ssr 0.3.0+ pattern)
export async function createSSRServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // Ignored if called from Server Component
          }
        },
      },
    }
  );
}
