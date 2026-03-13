import { generateUUID } from './uuid';
import { powerSyncDb } from '@/src/lib/powersync/database';
import type { PantryItem, PantryItemInput } from '@/src/types/pantry';

type PantryItemRow = {
  id: string;
  household_id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expiry_date: string | null;
  notes: string | null;
  is_bulk: number;
  low_stock: number;
  reserved: number;
  reserved_note: string | null;
  is_baseline: number;
  created_at: string;
  updated_at: string;
};

function rowToPantryItem(row: PantryItemRow): PantryItem {
  return {
    id: row.id,
    householdId: row.household_id,
    name: row.name,
    quantity: row.quantity,
    unit: row.unit,
    category: row.category,
    expirationDate: row.expiry_date,
    notes: row.notes,
    isBulk: row.is_bulk === 1,
    lowStock: row.low_stock === 1,
    reserved: row.reserved === 1,
    reservedNote: row.reserved_note,
    isBaseline: row.is_baseline === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const PANTRY_ITEM_COLS =
  'id, household_id, name, quantity, unit, category, expiry_date, notes, is_bulk, low_stock, reserved, reserved_note, is_baseline, created_at, updated_at';

export async function getAllPantryItems(
  householdId: string
): Promise<PantryItem[]> {
  const rows = await powerSyncDb.getAll<PantryItemRow>(
    `SELECT ${PANTRY_ITEM_COLS} FROM pantry_items WHERE household_id = ? ORDER BY category, name`,
    [householdId]
  );
  return rows.map(rowToPantryItem);
}

export async function getPantryItemById(
  id: string,
  householdId: string
): Promise<PantryItem | null> {
  const rows = await powerSyncDb.getAll<PantryItemRow>(
    `SELECT ${PANTRY_ITEM_COLS} FROM pantry_items WHERE id = ? AND household_id = ?`,
    [id, householdId]
  );
  const row = rows[0];
  return row ? rowToPantryItem(row) : null;
}

export async function createPantryItem(
  householdId: string,
  input: PantryItemInput
): Promise<PantryItem> {
  const id = generateUUID();
  const now = new Date().toISOString();

  await powerSyncDb.execute(
    `INSERT INTO pantry_items (id, household_id, name, quantity, unit, category, expiry_date, notes, is_bulk, low_stock, reserved, reserved_note, is_baseline, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      householdId,
      input.name,
      input.quantity,
      input.unit,
      input.category,
      input.expirationDate ?? null,
      input.notes ?? null,
      input.isBulk === true ? 1 : 0,
      input.lowStock === true ? 1 : 0,
      input.reserved === true ? 1 : 0,
      input.reservedNote ?? null,
      input.isBaseline === true ? 1 : 0,
      now,
      now,
    ]
  );

  const created = await getPantryItemById(id, householdId);
  if (!created) throw new Error('Failed to read created pantry item');
  return created;
}

export async function updatePantryItem(
  id: string,
  householdId: string,
  input: Partial<PantryItemInput>
): Promise<PantryItem | null> {
  const now = new Date().toISOString();

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (input.name !== undefined) {
    updates.push('name = ?');
    values.push(input.name);
  }
  if (input.quantity !== undefined) {
    updates.push('quantity = ?');
    values.push(input.quantity);
  }
  if (input.unit !== undefined) {
    updates.push('unit = ?');
    values.push(input.unit);
  }
  if (input.category !== undefined) {
    updates.push('category = ?');
    values.push(input.category);
  }
  if (input.expirationDate !== undefined) {
    updates.push('expiry_date = ?');
    values.push(input.expirationDate);
  }
  if (input.notes !== undefined) {
    updates.push('notes = ?');
    values.push(input.notes);
  }
  if (input.isBulk !== undefined) {
    updates.push('is_bulk = ?');
    values.push(input.isBulk ? 1 : 0);
  }
  if (input.lowStock !== undefined) {
    updates.push('low_stock = ?');
    values.push(input.lowStock ? 1 : 0);
  }
  if (input.reserved !== undefined) {
    updates.push('reserved = ?');
    values.push(input.reserved ? 1 : 0);
  }
  if (input.reservedNote !== undefined) {
    updates.push('reserved_note = ?');
    values.push(input.reservedNote);
  }
  if (input.isBaseline !== undefined) {
    updates.push('is_baseline = ?');
    values.push(input.isBaseline ? 1 : 0);
  }

  updates.push('updated_at = ?');
  values.push(now);
  values.push(id, householdId);

  const sql = `UPDATE pantry_items SET ${updates.join(', ')} WHERE id = ? AND household_id = ?`;
  await powerSyncDb.execute(sql, values);

  return getPantryItemById(id, householdId);
}

export async function deletePantryItem(
  id: string,
  householdId: string
): Promise<void> {
  await powerSyncDb.execute(
    'DELETE FROM pantry_items WHERE id = ? AND household_id = ?',
    [id, householdId]
  );
}
