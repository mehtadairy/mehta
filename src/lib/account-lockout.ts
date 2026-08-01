import { Resend } from 'resend';
import React from 'react';
import AccountLockedTemplate from '@/emails/AccountLockedTemplate';

export interface AccountLockRecord {
  identifier: string;
  failed_attempts: number;
  locked_until: number | null; // Timestamp ms
  last_failed_at: string; // ISO string
}

// In-Memory cache backed by persistent store
const lockStore = new Map<string, AccountLockRecord>();

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const PROGRESSIVE_DELAYS = [0, 500, 1000, 2000, 5000]; // Ms

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Checks if an account is currently locked out.
 */
export function getAccountLockStatus(identifier: string): {
  isLocked: boolean;
  remainingMs: number;
  attempts: number;
} {
  const key = identifier.trim().toLowerCase();
  const record = lockStore.get(key);

  if (!record) {
    return { isLocked: false, remainingMs: 0, attempts: 0 };
  }

  const now = Date.now();

  // Check if lock expired
  if (record.locked_until && now > record.locked_until) {
    // Lock expired, reset record
    lockStore.delete(key);
    return { isLocked: false, remainingMs: 0, attempts: 0 };
  }

  if (record.locked_until && now <= record.locked_until) {
    return {
      isLocked: true,
      remainingMs: record.locked_until - now,
      attempts: record.failed_attempts
    };
  }

  return { isLocked: false, remainingMs: 0, attempts: record.failed_attempts };
}

/**
 * Applies progressive delay based on the number of failed attempts.
 * Returns the delay applied in milliseconds.
 */
export async function applyProgressiveDelay(attemptCount: number): Promise<number> {
  const idx = Math.min(Math.max(0, attemptCount - 1), PROGRESSIVE_DELAYS.length - 1);
  const delayMs = PROGRESSIVE_DELAYS[idx] || 0;

  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  return delayMs;
}

/**
 * Records a failed login attempt for a user identifier.
 * Increments failed_attempts, applies progressive delay, and locks account if failed_attempts >= 5.
 */
export async function recordFailedAttempt(
  identifier: string,
  userEmail?: string | null
): Promise<{
  attempts: number;
  isLocked: boolean;
  delayMs: number;
  lockedUntilMs: number | null;
}> {
  const key = identifier.trim().toLowerCase();
  const nowMs = Date.now();
  const nowIso = new Date().toISOString();

  let record = lockStore.get(key);

  if (!record || (record.locked_until && nowMs > record.locked_until)) {
    record = {
      identifier: key,
      failed_attempts: 1,
      locked_until: null,
      last_failed_at: nowIso
    };
  } else {
    record.failed_attempts += 1;
    record.last_failed_at = nowIso;
  }

  // Calculate progressive delay for this attempt
  const delayMs = await applyProgressiveDelay(record.failed_attempts);

  // Check if lockout threshold reached (5 attempts)
  let isLocked = false;
  let lockedUntilMs: number | null = null;

  if (record.failed_attempts >= MAX_FAILED_ATTEMPTS) {
    isLocked = true;
    lockedUntilMs = nowMs + LOCKOUT_DURATION_MS;
    record.locked_until = lockedUntilMs;

    // Send security notification email if email provided
    if (userEmail && userEmail.includes('@')) {
      sendLockoutNotificationEmail(userEmail, key).catch((err) =>
        console.warn('[AccountLockout] Email notification dispatch warning:', err)
      );
    }
  }

  lockStore.set(key, record);

  return {
    attempts: record.failed_attempts,
    isLocked,
    delayMs,
    lockedUntilMs
  };
}

/**
 * Resets failed attempts and lock status upon successful authentication.
 */
export function resetAccountLock(identifier: string): void {
  const key = identifier.trim().toLowerCase();
  lockStore.delete(key);
}

/**
 * Sends security email notification when account is locked.
 */
async function sendLockoutNotificationEmail(email: string, identifier: string): Promise<void> {
  if (!resend) {
    console.warn('[AccountLockout] Resend API key missing. Email notification skipped.');
    return;
  }

  const domain = process.env.RESEND_DOMAIN || 'mehtadairy.com';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mehtadairy.com';
  const resetUrl = `${siteUrl}/login?tab=reset`;

  await resend.emails.send({
    from: `Mehta Dairy Security <security@${domain}>`,
    to: email.toLowerCase().trim(),
    subject: 'Security Alert: Your Mehta Dairy account has been temporarily locked',
    react: AccountLockedTemplate({
      userIdentifier: identifier,
      resetUrl
    }) as React.ReactElement
  });
}
