import { randomUUID } from 'expo-crypto';

/**
 * Generates a random UUID v4 string using expo-crypto.
 */
export function generateUUID(): string {
  return randomUUID();
}
