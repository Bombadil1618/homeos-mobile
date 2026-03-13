/**
 * Safely parse a value as a JSON array of strings.
 * Use for DB columns that store JSON arrays (e.g. dietaryRestrictions, allergies).
 * Returns [] on parse error, null, undefined, empty string, or non-array result.
 */
export function safeJsonParse(value: unknown): string[] {
  try {
    const raw =
      value == null || value === '' ? '[]' : String(value);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
