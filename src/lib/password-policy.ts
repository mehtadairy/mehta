import crypto from 'crypto';

const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 128;

const COMMON_PASSWORDS = new Set([
  'password1234',
  'password12345',
  'admin12345678',
  'mehtadairy123',
  '123456789012',
  'qwerty123456',
  'letmein12345',
  'welcome12345',
  'monkey123456',
  'dragon123456',
  'master123456',
  'football1234',
  'iloveyou1234'
]);

/**
 * Checks Have I Been Pwned k-Anonymity API (SHA-1 prefix check) for breached passwords.
 * Sends only the first 5 characters of SHA-1 hash to preserve privacy.
 */
async function isPasswordBreached(password: string): Promise<boolean> {
  try {
    const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = sha1.substring(0, 5);
    const suffix = sha1.substring(5);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'User-Agent': 'MehtaDairy-SecurityAudit' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) return false;

    const text = await res.text();
    const lines = text.split('\n');

    for (const line of lines) {
      const [hashSuffix] = line.split(':');
      if (hashSuffix && hashSuffix.trim() === suffix) {
        return true; // Breached password detected
      }
    }
  } catch (e) {
    // Non-fatal fallback if HIBP API is unreachable or times out
  }
  return false;
}

/**
 * Validates a password against security policy rules:
 * - Length: 12 to 128 characters
 * - Reject common/dictionary passwords
 * - Reject passwords found in data breaches (HIBP k-Anonymity)
 */
export async function validatePasswordPolicy(password: string): Promise<{ valid: boolean; reason?: string }> {
  if (!password || typeof password !== 'string') {
    return { valid: false, reason: 'Password is required' };
  }

  // Length checks
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { valid: false, reason: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.` };
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return { valid: false, reason: `Password cannot exceed ${MAX_PASSWORD_LENGTH} characters.` };
  }

  // Common password checks
  const lower = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lower) || lower.includes('password') || lower.includes('admin123')) {
    return { valid: false, reason: 'This password is too common and easily guessable. Please choose a stronger password.' };
  }

  // Have I Been Pwned Data Breach Check
  const breached = await isPasswordBreached(password);
  if (breached) {
    return { valid: false, reason: 'This password has appeared in a known data breach. Please choose a different password.' };
  }

  return { valid: true };
}
