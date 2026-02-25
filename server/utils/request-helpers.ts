import { Request } from 'express';

/**
 * Safe helper to extract string values from Express request parameters
 * Handles both string and string[] types that Express can return
 */
export function getParamString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
}

/**
 * Safe helper to extract string values from Express query parameters
 */
export function getQueryString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
}

/**
 * Type guard to safely use request params that might be string or string[]
 */
export function asString(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] : (value || '');
}
