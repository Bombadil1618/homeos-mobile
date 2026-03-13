import type { AbstractPowerSyncDatabase, PowerSyncBackendConnector } from '@powersync/react-native';
import { UpdateType } from '@powersync/react-native';

import { supabase } from '@/src/lib/supabase';

const POWERSYNC_URL = process.env.EXPO_PUBLIC_POWERSYNC_URL!;

const SYNCED_TABLES = ['households', 'household_members', 'family_members', 'pantry_items'] as const;

/** Columns that exist in Supabase per table; upload payloads are filtered to these only. */
const SUPABASE_COLUMNS: Record<(typeof SYNCED_TABLES)[number], string[]> = {
  households: ['id', 'name', 'created_at'],
  household_members: ['id', 'household_id', 'user_id', 'role', 'joined_at'],
  family_members: [
    'id',
    'household_id',
    'name',
    'relationship',
    'date_of_birth',
    'allergies',
    'dietary_restrictions',
    'favorite_meals',
    'include_in_meal_planning',
    'created_at',
    'updated_at',
  ],
  pantry_items: [
    'id',
    'household_id',
    'name',
    'category',
    'quantity',
    'unit',
    'expiry_date',
    'notes',
    'created_at',
    'updated_at',
  ],
};

function isSyncedTable(table: string): table is (typeof SYNCED_TABLES)[number] {
  return (SYNCED_TABLES as readonly string[]).includes(table);
}

function filterPayload(
  table: (typeof SYNCED_TABLES)[number],
  opData: Record<string, unknown>
): Record<string, unknown> {
  const allowed = new Set(SUPABASE_COLUMNS[table]);
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(opData)) {
    if (allowed.has(key)) {
      out[key] = value;
    }
  }
  return out;
}

export class PowerSyncConnector implements PowerSyncBackendConnector {
  async fetchCredentials() {
    console.log('fetchCredentials called');

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      console.log('fetchCredentials: no session found', error ? { error } : '');
      return null;
    }

    console.log('fetchCredentials: session found, returning endpoint:', POWERSYNC_URL);
    return {
      endpoint: POWERSYNC_URL,
      token: session.access_token,
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : undefined,
    };
  }

  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    console.log('uploadData called');

    let batch = await database.getCrudBatch();

    if (batch == null) {
      console.log('No batch found');
      return;
    }

    while (batch != null) {
      console.log('batch:', batch);

      for (const entry of batch.crud) {
        console.log('Processing op:', entry.op, entry.id, entry.table);

        if (!isSyncedTable(entry.table)) {
          continue;
        }

        switch (entry.op) {
          case UpdateType.PUT: {
            const raw = entry.opData ?? {};
            const payload = filterPayload(entry.table, raw);
            if (entry.table === 'pantry_items' && typeof payload.quantity === 'number') {
              payload.quantity = String(payload.quantity);
            }
            const { data, error } = await supabase.from(entry.table).upsert(payload, {
              onConflict: 'id',
            });
            console.log('Supabase upsert result:', { data, error });
            if (error) throw error;
            break;
          }
          case UpdateType.PATCH: {
            const raw = entry.opData ?? {};
            const payload = filterPayload(entry.table, raw);
            if (entry.table === 'pantry_items' && typeof payload.quantity === 'number') {
              payload.quantity = String(payload.quantity);
            }
            const { data, error } = await supabase
              .from(entry.table)
              .update(payload)
              .eq('id', entry.id);
            console.log('Supabase update result:', { data, error });
            if (error) throw error;
            break;
          }
          case UpdateType.DELETE: {
            const { data, error } = await supabase.from(entry.table).delete().eq('id', entry.id);
            console.log('Supabase delete result:', { data, error });
            if (error) throw error;
            break;
          }
        }
      }

      await batch.complete();
      batch = await database.getCrudBatch();
    }
  }
}
