/**
 * Module constants for the simplified RBAC system
 * This module defines the module types supported by the application
 */

/**
 * Demo customer ID used across all demo environments
 * This constant replaces hardcoded 'demo-customer' strings throughout the codebase
 */
export const DEMO_CUSTOMER_ID = "demo-customer" as const;

/**
 * Module types supported by the application
 */
export type ModuleType = "post_secondary" | "k12" | "tutoring";
