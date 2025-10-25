/**
 * Centralized environment constants and utility functions
 * This module consolidates environment-related logic that was previously
 * scattered across multiple files in both client and server code.
 */

import { type EnvironmentType, environments } from '../environment';

/**
 * Demo customer ID used across all demo environments
 * This constant replaces hardcoded 'demo-customer' strings throughout the codebase
 */
export const DEMO_CUSTOMER_ID = 'demo-customer' as const;

/**
 * Module types supported by the application
 */
export type ModuleType = 'post_secondary' | 'k12' | 'tutoring';

/**
 * Valid environment types (re-exported for convenience)
 */
export type Environment = EnvironmentType;

/**
 * Mapping of environments to their locked modules
 * Used for enforcing module restrictions in specific environments
 */
export const MODULE_BY_ENVIRONMENT: Record<EnvironmentType, ModuleType | null> = {
  'production': null,
  'development': null,
  'replit-prod': null,
  'replit-dev': null,
  'tutoring': 'tutoring',
  'post-secondary-demo': 'post_secondary',
  'post-secondary-dev': 'post_secondary',
  'k12-demo': 'k12',
  'k12-dev': 'k12',
  'tutoring-demo': 'tutoring',
  'tutoring-dev': 'tutoring',
};

/**
 * Check if an environment is a demo environment
 * Demo environments have read-only access and customer isolation
 */
export function isDemoEnvironment(env: string | undefined): boolean {
  if (!env) return false;
  return env.includes('demo');
}

/**
 * Check if an environment is read-only
 * Currently, only demo environments are read-only
 */
export function isReadOnlyEnvironment(env: string | undefined): boolean {
  return isDemoEnvironment(env);
}

/**
 * Get the locked module for a given environment
 * Returns null if the environment allows all modules
 */
export function getModuleForEnvironment(env: EnvironmentType): ModuleType | null {
  return MODULE_BY_ENVIRONMENT[env] || null;
}

/**
 * Check if a module is valid for a given environment
 * Returns true if the environment has no module restriction or if the module matches
 */
export function isValidModuleForEnvironment(
  module: ModuleType,
  env: EnvironmentType
): boolean {
  const lockedModule = getModuleForEnvironment(env);
  return lockedModule === null || lockedModule === module;
}

/**
 * Get environment configuration by ID
 */
export function getEnvironmentById(envId: EnvironmentType) {
  return environments.find(env => env.id === envId);
}

/**
 * Check if an environment has a locked module
 */
export function hasLockedModule(env: EnvironmentType): boolean {
  return getModuleForEnvironment(env) !== null;
}

/**
 * Get all demo environments
 */
export function getDemoEnvironments() {
  return environments.filter(env => env.demoMode === true);
}

/**
 * Get all development environments
 */
export function getDevEnvironments() {
  return environments.filter(env =>
    env.id.includes('dev') && !env.demoMode
  );
}

/**
 * Normalize environment string for comparison
 * Handles various environment variable formats
 */
export function normalizeEnvironment(envString: string | undefined): string {
  if (!envString) return '';
  return envString.toLowerCase().trim();
}

/**
 * Validate if a string is a valid environment type
 */
export function isValidEnvironment(env: string): env is EnvironmentType {
  return environments.some(e => e.id === env);
}

/**
 * Get the current environment from process.env (server-side)
 * Falls back to 'development' if not set
 */
export function getCurrentEnvironment(): EnvironmentType {
  const env = process.env.APP_ENVIRONMENT || 'development';
  return isValidEnvironment(env) ? env : 'development';
}

/**
 * Export all environment types for convenience
 */
export { type EnvironmentType, environments } from '../environment';
