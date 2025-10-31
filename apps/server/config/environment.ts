/**
 * Environment Configuration
 *
 * Centralized configuration for environment variables used throughout the application.
 * This file provides type-safe access to environment variables with sensible defaults.
 */

/**
 * Email Verification Configuration
 */
export const emailVerificationConfig = {
  /**
   * Hours until verification links expire
   * Default: 24 hours
   */
  expiryHours: parseInt(
    process.env.EMAIL_VERIFICATION_EXPIRY_HOURS || "24",
    10
  ),

  /**
   * Base URL for verification links
   * Must match your deployment URL
   * Examples:
   * - Development: http://localhost:5001
   * - Staging: https://staging.thriveiep.com
   * - Production: https://thriveiep.com
   */
  baseUrl: process.env.EMAIL_VERIFICATION_BASE_URL || "http://localhost:5001",
};

/**
 * Rate Limiting Configuration
 */
export const rateLimitConfig = {
  /**
   * Maximum registration attempts per IP per hour
   * Default: 5
   */
  registration: parseInt(process.env.REGISTRATION_RATE_LIMIT || "5", 10),

  /**
   * Maximum resend verification requests per email per hour
   * Default: 3
   */
  resendVerification: parseInt(
    process.env.RESEND_VERIFICATION_RATE_LIMIT || "3",
    10
  ),

  /**
   * Maximum support/sales requests per IP per hour
   * Default: 10
   */
  supportSales: parseInt(process.env.SUPPORT_SALES_RATE_LIMIT || "10", 10),
};

/**
 * Admin Notification Configuration
 */
export const adminNotificationConfig = {
  /**
   * Enable/disable admin email notifications
   * Default: true
   *
   * Set to false in development to avoid spam during testing
   */
  enabled: process.env.ADMIN_NOTIFICATION_ENABLED !== "false",
};

/**
 * SendGrid Email Configuration
 */
export const emailConfig = {
  /**
   * SendGrid API key for sending emails
   * Required for email functionality
   */
  apiKey: process.env.SENDGRID_API_KEY,

  /**
   * From email address for all outgoing emails
   * Must be verified in SendGrid
   * Default: eric@thriveiep.com
   */
  fromEmail: process.env.SENDGRID_FROM_EMAIL || "eric@thriveiep.com",
};

/**
 * Validate required environment variables
 * Throws an error if critical variables are missing
 */
export function validateEnvironmentConfig(): void {
  const errors: string[] = [];

  // Check SendGrid configuration
  if (!emailConfig.apiKey) {
    errors.push("SENDGRID_API_KEY is required for email functionality");
  }

  // Check email verification base URL
  if (!emailVerificationConfig.baseUrl) {
    errors.push(
      "EMAIL_VERIFICATION_BASE_URL is required for email verification"
    );
  }

  // Validate rate limit values are positive integers
  if (rateLimitConfig.registration <= 0) {
    errors.push("REGISTRATION_RATE_LIMIT must be a positive integer");
  }

  if (rateLimitConfig.resendVerification <= 0) {
    errors.push("RESEND_VERIFICATION_RATE_LIMIT must be a positive integer");
  }

  if (rateLimitConfig.supportSales <= 0) {
    errors.push("SUPPORT_SALES_RATE_LIMIT must be a positive integer");
  }

  // Validate expiry hours
  if (emailVerificationConfig.expiryHours <= 0) {
    errors.push("EMAIL_VERIFICATION_EXPIRY_HOURS must be a positive integer");
  }

  if (errors.length > 0) {
    throw new Error(
      `Environment configuration errors:\n${errors
        .map((e) => `  - ${e}`)
        .join("\n")}`
    );
  }
}

/**
 * Log current configuration (for debugging)
 * Masks sensitive values
 */
export function logEnvironmentConfig(): void {
  console.log("📧 Email Verification Configuration:");
  console.log(`  - Expiry Hours: ${emailVerificationConfig.expiryHours}`);
  console.log(`  - Base URL: ${emailVerificationConfig.baseUrl}`);

  console.log("\n🚦 Rate Limiting Configuration:");
  console.log(`  - Registration: ${rateLimitConfig.registration} per hour`);
  console.log(
    `  - Resend Verification: ${rateLimitConfig.resendVerification} per hour`
  );
  console.log(`  - Support/Sales: ${rateLimitConfig.supportSales} per hour`);

  console.log("\n🔔 Admin Notification Configuration:");
  console.log(`  - Enabled: ${adminNotificationConfig.enabled}`);

  console.log("\n📨 Email Configuration:");
  console.log(
    `  - API Key: ${emailConfig.apiKey ? "***configured***" : "NOT SET"}`
  );
  console.log(`  - From Email: ${emailConfig.fromEmail}`);
}
