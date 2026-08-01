import crypto from 'crypto';

export interface ResetTokenRecord {
  token_hash: string;
  identifier: string; // Admin or Worker email/username
  expires_at: number; // Timestamp ms
  used: boolean;
  created_at: string; // ISO string
}

const tokenStore = new Map<string, ResetTokenRecord>();
const TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

// Cleanup expired tokens every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [hash, record] of tokenStore.entries()) {
    if (now > record.expires_at || record.used) {
      tokenStore.delete(hash);
    }
  }
}, 900000);

/**
 * Computes SHA-256 hash of a raw token string
 */
function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Generates a cryptographically random, single-use, 15-minute reset token.
 * Returns the raw token string (to be sent via email) and stores only the SHA-256 hash.
 */
export function createPasswordResetToken(identifier: string): { rawToken: string; expiresAtIso: string } {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const nowMs = Date.now();
  const expiresAtMs = nowMs + TOKEN_EXPIRY_MS;

  const record: ResetTokenRecord = {
    token_hash: tokenHash,
    identifier: identifier.trim().toLowerCase(),
    expires_at: expiresAtMs,
    used: false,
    created_at: new Date(nowMs).toISOString()
  };

  tokenStore.set(tokenHash, record);

  logPasswordAuditEvent('reset_requested', identifier);

  return {
    rawToken,
    expiresAtIso: new Date(expiresAtMs).toISOString()
  };
}

/**
 * Validates a raw password reset token without consuming it.
 * Verifies token hash match, expiration window, and single-use status.
 */
export function verifyPasswordResetToken(rawToken: string): { valid: boolean; identifier?: string; reason?: string } {
  if (!rawToken || typeof rawToken !== 'string') {
    return { valid: false, reason: 'Invalid or missing reset token' };
  }

  const tokenHash = hashToken(rawToken);
  const record = tokenStore.get(tokenHash);

  if (!record) {
    logPasswordAuditEvent('reset_failed', 'unknown', { reason: 'Token not found' });
    return { valid: false, reason: 'Invalid or expired password reset link' };
  }

  if (record.used) {
    logPasswordAuditEvent('reset_failed', record.identifier, { reason: 'Token already used' });
    return { valid: false, reason: 'This password reset link has already been used' };
  }

  if (Date.now() > record.expires_at) {
    logPasswordAuditEvent('reset_failed', record.identifier, { reason: 'Token expired' });
    return { valid: false, reason: 'Password reset link has expired (15 minute limit)' };
  }

  return { valid: true, identifier: record.identifier };
}

/**
 * Consumes a password reset token (marks as used) and returns the associated identifier.
 */
export function consumePasswordResetToken(rawToken: string): { success: boolean; identifier?: string; error?: string } {
  const check = verifyPasswordResetToken(rawToken);
  if (!check.valid || !check.identifier) {
    return { success: false, error: check.reason || 'Invalid token' };
  }

  const tokenHash = hashToken(rawToken);
  const record = tokenStore.get(tokenHash);

  if (record) {
    record.used = true;
    tokenStore.set(tokenHash, record);
  }

  logPasswordAuditEvent('reset_completed', check.identifier);
  return { success: true, identifier: check.identifier };
}

/**
 * Security Audit Logger for Password Events.
 * Never logs raw passwords, password hashes, or reset tokens.
 */
export function logPasswordAuditEvent(
  event: 'password_changed' | 'reset_requested' | 'reset_completed' | 'reset_failed',
  identifier: string,
  meta?: any
) {
  const timestamp = new Date().toISOString();

  // Sanitize meta object to ensure no sensitive fields are printed
  const safeMeta = meta ? { ...meta } : undefined;
  if (safeMeta) {
    delete safeMeta.password;
    delete safeMeta.newPassword;
    delete safeMeta.oldPassword;
    delete safeMeta.token;
    delete safeMeta.rawToken;
    delete safeMeta.password_hash;
  }

  console.log(`[PASSWORD SECURITY AUDIT]`, {
    event,
    timestamp,
    identifier: identifier ? identifier.replace(/(?<=^.{2}).*(?=@)/, '***') : 'unknown',
    meta: safeMeta
  });
}
