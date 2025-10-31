import crypto from "crypto";
import bcrypt from "bcryptjs";

/**
 * Email Verification Service
 *
 * Handles secure token generation, hashing, validation, and verification link creation
 * for email verification during user registration.
 *
 * Requirements: 3.2, 10.1, 10.2, 10.3
 */

export interface VerificationToken {
  token: string;
  hashedToken: string;
  expiry: Date;
}

/**
 * Generate a cryptographically secure verification token
 *
 * Uses crypto.randomBytes to generate a 32-byte random token
 * Returns both the plain token (to send to user) and hashed version (to store in DB)
 *
 * @returns Object containing plain token and hashed token
 */
export function generateVerificationToken(): {
  token: string;
  hashedToken: string;
} {
  const token = crypto.randomBytes(32).toString("hex");
  const hashedToken = hashToken(token);
  return { token, hashedToken };
}

/**
 * Hash a token using bcrypt
 *
 * Uses bcrypt with salt rounds of 10 for secure one-way hashing
 *
 * @param token - Plain text token to hash
 * @returns Hashed token
 */
export function hashToken(token: string): string {
  return bcrypt.hashSync(token, 10);
}

/**
 * Validate a verification token
 *
 * Checks if the provided token matches the hashed token and hasn't expired
 *
 * @param token - Plain text token from verification link
 * @param hashedToken - Hashed token stored in database
 * @param expiry - Expiration timestamp from database
 * @returns true if token is valid and not expired, false otherwise
 */
export function validateToken(
  token: string,
  hashedToken: string,
  expiry: Date
): boolean {
  const now = new Date();
  if (now > expiry) {
    return false;
  }
  return bcrypt.compareSync(token, hashedToken);
}

/**
 * Create a verification link with token
 *
 * Generates a complete URL for email verification
 *
 * @param token - Plain text verification token
 * @param baseUrl - Base URL of the application (e.g., https://app.example.com)
 * @returns Complete verification URL
 */
export function createVerificationLink(token: string, baseUrl: string): string {
  const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${cleanBaseUrl}/verify-email?token=${encodeURIComponent(token)}`;
}

/**
 * Generate a complete verification token with expiry
 *
 * Creates a token that expires after the specified number of hours
 *
 * @param expiryHours - Number of hours until token expires (default: 24)
 * @returns Object containing token, hashed token, and expiry date
 */
export function generateVerificationTokenWithExpiry(
  expiryHours: number = 24
): VerificationToken {
  const { token, hashedToken } = generateVerificationToken();
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + expiryHours);
  return {
    token,
    hashedToken,
    expiry,
  };
}
