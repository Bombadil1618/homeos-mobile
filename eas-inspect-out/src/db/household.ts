import { generateUUID } from './uuid';
import { powerSyncDb } from '@/src/lib/powersync/database';

export interface HouseholdRow {
  id: string;
  name: string | null;
}

/**
 * Returns the first household in the database, or null if none exists.
 */
export async function getDefaultHousehold(): Promise<HouseholdRow | null> {
  const rows = await powerSyncDb.getAll<{ id: string; name: string | null }>(
    'SELECT id, name FROM households LIMIT 1'
  );
  const row = rows[0] ?? null;
  return row ?? null;
}

/**
 * Returns the default household. If none exists, creates one with name "My Household" and returns it.
 */
export async function getOrCreateDefaultHousehold(): Promise<HouseholdRow> {
  const existing = await getDefaultHousehold();
  if (existing) return existing;

  const id = generateUUID();
  const now = new Date().toISOString();
  const name = 'My Household';

  await powerSyncDb.execute(
    'INSERT INTO households (id, name, created_at) VALUES (?, ?, ?)',
    [id, name, now]
  );

  return { id, name };
}
