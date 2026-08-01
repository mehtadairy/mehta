import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const BCRYPT_COST_FACTOR = 12;
export const MAX_PASSWORD_HISTORY = 5;

/**
 * Hash a plain text password using bcrypt with Cost Factor 12
 */
export function hashPassword(password: string): string {
  if (!password) {
    throw new Error('Cannot hash empty password');
  }
  return bcrypt.hashSync(password, BCRYPT_COST_FACTOR);
}

/**
 * Checks if a stored password hash requires automatic migration to bcrypt cost 12
 */
export function needsRehash(storedHash: string): boolean {
  if (!storedHash) return true;
  return !storedHash.startsWith('$2b$12$') && !storedHash.startsWith('$2a$12$');
}

/**
 * Securely verify a plain text password against a stored hash using constant-time comparison
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;

  // 1. Standard Bcrypt Hash Verification ($2a$, $2b$, $2y$)
  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
    try {
      return bcrypt.compareSync(password, storedHash);
    } catch (e) {
      console.error('[PasswordUtils] Bcrypt verification error:', e);
      return false;
    }
  }

  // 2. Legacy Scrypt Salt:Hash Format Verification (salt:hash)
  if (storedHash.includes(':')) {
    try {
      const [salt, key] = storedHash.split(':');
      if (salt && key) {
        const derivedKey = crypto.scryptSync(password, salt, 64);
        const keyBuffer = Buffer.from(key, 'hex');
        if (keyBuffer.length === derivedKey.length) {
          return crypto.timingSafeEqual(keyBuffer, derivedKey);
        }
      }
    } catch (e) {
      console.error('[PasswordUtils] Legacy scrypt verification error:', e);
    }
    return false;
  }

  // 3. Legacy Plaintext Fallback (Constant-time comparison)
  try {
    const passwordBuffer = Buffer.from(password);
    const hashBuffer = Buffer.from(storedHash);
    if (passwordBuffer.length === hashBuffer.length) {
      return crypto.timingSafeEqual(passwordBuffer, hashBuffer);
    }
  } catch (e) {
    // Ignore length mismatch
  }

  return false;
}

/**
 * Checks if a new password matches any of the last 5 stored password hashes in history.
 * Prevents password reuse across Admin and Worker accounts.
 */
export function checkPasswordHistory(newPassword: string, historyHashes: string[]): boolean {
  if (!newPassword || !Array.isArray(historyHashes) || historyHashes.length === 0) {
    return false;
  }

  for (const oldHash of historyHashes) {
    if (oldHash && verifyPassword(newPassword, oldHash)) {
      return true; // Match found in history -> reuse attempt detected!
    }
  }

  return false;
}

/**
 * Appends a new password hash to history and retains only the last 5 hashes.
 */
export function updatePasswordHistory(historyHashes: string[] = [], newHash: string): string[] {
  const currentHistory = Array.isArray(historyHashes) ? historyHashes : [];
  return [newHash, ...currentHistory.filter((h) => h !== newHash)].slice(0, MAX_PASSWORD_HISTORY);
}

/**
 * Generate a random strong password (16 characters, high entropy)
 */
export function generateStrongPassword(length = 16): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
  let pass = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    pass += chars[bytes[i] % chars.length];
  }
  return pass;
}
