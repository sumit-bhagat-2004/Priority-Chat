// lib/sanitize.ts — Input sanitization utilities
import { z } from 'zod';

/**
 * Sanitize a string for safe storage and display:
 * - Trims whitespace
 * - Limits length
 * - Strips null bytes
 * - Preserves all Unicode (emoji, i18n)
 */
export function sanitizeText(input: string, maxLength = 2000): string {
  return input
    .replace(/\0/g, '')   // Remove null bytes
    .trim()
    .slice(0, maxLength);
}

/**
 * Zod schema for message content
 */
export const MessageContentSchema = z.string()
  .min(1, 'Message cannot be empty')
  .max(2000, 'Message too long (max 2000 chars)')
  .transform((s) => sanitizeText(s, 2000));

/**
 * Zod schema for username
 */
export const UsernameSchema = z.string()
  .min(2, 'Name must be at least 2 characters')
  .max(24, 'Name must be at most 24 characters')
  .regex(/^[a-zA-Z0-9_\- ]+$/, 'Only letters, numbers, spaces, hyphens, underscores allowed')
  .transform((s) => s.trim());

/**
 * Zod schema for room name
 */
export const RoomNameSchema = z.string()
  .min(1, 'Room name cannot be empty')
  .max(50, 'Room name too long (max 50 chars)')
  .transform((s) => sanitizeText(s, 50));
