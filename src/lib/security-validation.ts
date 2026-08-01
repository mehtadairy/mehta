import { z } from 'zod';

/**
 * Checks if a string contains HTML tags, script tags, event handlers, or javascript: protocols.
 */
export function containsScriptOrHtml(value: string): boolean {
  if (!value) return false;
  const scriptRegex = /<[^>]*>|javascript:|on\w+\s*=/i;
  return scriptRegex.test(value);
}

/**
 * Zod refinement schema ensuring text does NOT contain HTML or script tags.
 */
export const safeTextSchema = z.string().refine((val) => !containsScriptOrHtml(val), {
  message: 'Invalid characters detected'
});

/**
 * Strict Email validation schema
 */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Invalid email format')
  .max(255, 'Email exceeds maximum length')
  .email('Invalid email format')
  .refine((val) => !containsScriptOrHtml(val), {
    message: 'Invalid characters in email'
  });

/**
 * Strict Phone validation schema (cleans formatting then verifies 10-15 numeric digits)
 */
export const phoneSchema = z
  .string()
  .trim()
  .refine((val) => !containsScriptOrHtml(val), {
    message: 'Invalid characters in phone number'
  })
  .transform((val) => val.replace(/\D/g, ''))
  .pipe(
    z.string().min(10, 'Invalid phone number length').max(15, 'Invalid phone number length')
  );

/**
 * Strict Name validation schema (2-100 characters, no HTML/script tags, valid letters/spaces)
 */
export const nameSchema = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name exceeds maximum length')
  .refine((val) => !containsScriptOrHtml(val), {
    message: 'Name contains invalid or script characters'
  })
  .refine((val) => /^[a-zA-Z\s\.\'\-]+$/.test(val), {
    message: 'Name contains disallowed characters'
  });

/**
 * Username / Employee ID validation schema
 */
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Username must be at least 3 characters')
  .max(100, 'Username exceeds maximum length')
  .refine((val) => !containsScriptOrHtml(val), {
    message: 'Username contains invalid characters'
  });

/**
 * Password validation schema
 */
export const passwordSchema = z
  .string()
  .min(4, 'Password does not meet requirements')
  .max(128, 'Password exceeds maximum length')
  .refine((val) => !containsScriptOrHtml(val), {
    message: 'Password contains invalid characters'
  });

/**
 * OTP 6-digit numeric verification schema
 */
export const otpSchema = z
  .string()
  .trim()
  .length(6, 'OTP must be exactly 6 digits')
  .regex(/^\d{6}$/, 'OTP must contain digits only');

/**
 * Security Audit Log for rejected submissions
 */
export function logRejectedSubmission(endpoint: string, reason: string, details?: any) {
  const timestamp = new Date().toISOString();
  console.warn(`[SECURITY AUDIT - REJECTED SUBMISSION]`, {
    timestamp,
    endpoint,
    reason,
    details: details ? (typeof details === 'object' ? JSON.stringify(details) : details) : undefined
  });
}
