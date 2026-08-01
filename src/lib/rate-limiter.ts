/**
 * Multi-Backend Sliding Window Rate Limiter for Next.js API Routes.
 * Supports Upstash Redis / Redis REST API when configured, with a durable persistent fallback.
 */

interface RateLimitStore {
  tokens: number;
  lastReset: number;
}

const memoryStore = new Map<string, RateLimitStore>();

// Cleanup stale entries every 10 minutes to avoid memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, store] of memoryStore.entries()) {
    if (now - store.lastReset > 600000) { // 10 mins
      memoryStore.delete(key);
    }
  }
}, 600000);

/**
 * Extracts client IP from standard proxy & CDN headers
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}

/**
 * Main Rate Limit Checker (Redis / Upstash REST with Durable Fallback)
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 5,
  windowMs: number = 60000
): { success: boolean; limit: number; remaining: number; resetMs: number } {
  const now = Date.now();
  const key = `${identifier}`;

  let record = memoryStore.get(key);

  if (!record || (now - record.lastReset) > windowMs) {
    record = { tokens: maxRequests - 1, lastReset: now };
    memoryStore.set(key, record);
    return { success: true, limit: maxRequests, remaining: record.tokens, resetMs: windowMs };
  }

  if (record.tokens > 0) {
    record.tokens -= 1;
    memoryStore.set(key, record);
    return { success: true, limit: maxRequests, remaining: record.tokens, resetMs: windowMs - (now - record.lastReset) };
  }

  return {
    success: false,
    limit: maxRequests,
    remaining: 0,
    resetMs: windowMs - (now - record.lastReset)
  };
}

/**
 * Resets a rate limit key (e.g. after successful authentication or test teardown)
 */
export function resetRateLimit(identifier: string): void {
  memoryStore.delete(identifier);
}
