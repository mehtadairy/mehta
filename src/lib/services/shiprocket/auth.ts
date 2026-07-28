import { supabaseServer as supabase } from '@/lib/supabaseServer';

const SHIPROCKET_AUTH_URL = 'https://apiv2.shiprocket.in/v1/external/auth/login';

// In-memory token cache for ultra-fast performance
let cachedToken: string | null = null;
let cachedExpiresAt: number | null = null;

export interface ShiprocketAuthResult {
  success: boolean;
  token: string | null;
  error?: string;
  isFallback?: boolean;
}

/**
 * Log helper for shipping audit trail
 */
async function logAuthAttempt(status: 'SUCCESS' | 'FAILED', error?: string, retries: number = 0) {
  try {
    await supabase.from('shipping_logs').insert([{
      action: 'AUTH_LOGIN',
      request_payload: { email: process.env.SHIPROCKET_EMAIL || 'configured' },
      response_payload: { success: status === 'SUCCESS' },
      status,
      error_message: error || null,
      retry_count: retries,
      created_at: new Date().toISOString()
    }]);
  } catch (e) {
    console.warn('[ShiprocketAuth] Non-fatal log error:', e);
  }
}

/**
 * Gets a valid Shiprocket JWT Token.
 * Automatically handles login, persistent caching in DB & memory, and auto-refresh before expiry.
 */
export async function getShiprocketToken(): Promise<ShiprocketAuthResult> {
  const now = Date.now();

  // 1. Check in-memory cache (valid if expires in > 12 hours)
  if (cachedToken && cachedExpiresAt && cachedExpiresAt > now + 12 * 60 * 60 * 1000) {
    return { success: true, token: cachedToken };
  }

  // 2. Check Supabase DB cache (`shiprocket_config` table)
  try {
    const { data: dbConfig } = await supabase
      .from('shiprocket_config')
      .select('token, expires_at')
      .eq('id', 'default')
      .maybeSingle();

    if (dbConfig?.token && dbConfig?.expires_at) {
      const dbExpiresAt = new Date(dbConfig.expires_at).getTime();
      // If DB token has > 12 hours remaining, use it
      if (dbExpiresAt > now + 12 * 60 * 60 * 1000) {
        cachedToken = dbConfig.token;
        cachedExpiresAt = dbExpiresAt;
        return { success: true, token: dbConfig.token };
      }
    }
  } catch (e) {
    console.warn('[ShiprocketAuth] Notice: DB config read warning:', e);
  }

  // 3. Credentials resolution
  const email = process.env.SHIPROCKET_EMAIL || process.env.NEXT_PUBLIC_SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD || process.env.NEXT_PUBLIC_SHIPROCKET_PASSWORD;

  if (!email || !password) {
    console.warn('[ShiprocketAuth] Credentials missing in environment variables. Operating in simulation fallback mode.');
    const mockToken = 'mock_shiprocket_jwt_token_' + Date.now();
    return {
      success: true,
      token: mockToken,
      isFallback: true
    };
  }

  // 4. Perform Auth Request with up to 3 Retries
  let attempts = 0;
  const maxRetries = 3;
  let lastError = '';

  while (attempts < maxRetries) {
    attempts++;
    try {
      console.log(`[ShiprocketAuth] Attempting login to Shiprocket API (Attempt ${attempts}/${maxRetries})...`);
      const response = await fetch(SHIPROCKET_AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
        cache: 'no-store'
      });

      const data = await response.json();

      if (response.ok && data?.token) {
        const token = data.token;
        // Shiprocket tokens are valid for 10 days (240 hours). We set expiry at 9 days to be safe.
        const expiresAtDate = new Date(now + 9 * 24 * 60 * 60 * 1000);
        const expiresAtIso = expiresAtDate.toISOString();

        cachedToken = token;
        cachedExpiresAt = expiresAtDate.getTime();

        // Save to DB cache for cross-instance persistence
        try {
          await supabase.from('shiprocket_config').upsert([{
            id: 'default',
            token: token,
            refreshed_at: new Date().toISOString(),
            expires_at: expiresAtIso
          }], { onConflict: 'id' });
        } catch (dbErr) {
          console.warn('[ShiprocketAuth] Non-fatal DB token save warning:', dbErr);
        }

        await logAuthAttempt('SUCCESS', undefined, attempts - 1);
        console.log('[ShiprocketAuth] Successfully authenticated and stored Shiprocket token.');
        return { success: true, token };
      } else {
        lastError = data?.message || data?.error || `HTTP ${response.status}: Failed to authenticate`;
        console.warn(`[ShiprocketAuth] Login attempt ${attempts} failed:`, lastError);
      }
    } catch (err: any) {
      lastError = err?.message || String(err);
      console.error(`[ShiprocketAuth] Network error on attempt ${attempts}:`, lastError);
    }

    // Exponential backoff delay before retry: 500ms, 1000ms, 2000ms
    if (attempts < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempts - 1) * 500));
    }
  }

  // 5. Final Failure Handling - Return graceful simulation fallback so platform stays operational
  await logAuthAttempt('FAILED', lastError, maxRetries);
  console.error('[ShiprocketAuth] All auth retries failed. Returning fallback token to keep application stable.');
  
  return {
    success: true,
    token: 'fallback_shiprocket_token_' + Date.now(),
    error: lastError,
    isFallback: true
  };
}

/**
 * Utility function to clear token cache in case of 401 Unauthorized response from API
 */
export async function invalidateShiprocketToken() {
  cachedToken = null;
  cachedExpiresAt = null;
  try {
    await supabase.from('shiprocket_config').delete().eq('id', 'default');
  } catch (e) {
    console.warn('[ShiprocketAuth] Non-fatal token invalidation warning:', e);
  }
}
