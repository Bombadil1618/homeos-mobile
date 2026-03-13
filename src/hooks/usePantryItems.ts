import { useCallback, useEffect, useState } from 'react';
import {
  createPantryItem,
  deletePantryItem,
  getAllPantryItems,
  updatePantryItem,
} from '@/src/db/pantryItems';
import { getOrCreateDefaultHousehold } from '@/src/db/household';
import type { PantryItem, PantryItemInput } from '@/src/types/pantry';

export function usePantryItems(): {
  items: PantryItem[];
  loading: boolean;
  error: string | null;
  addItem: (input: PantryItemInput) => Promise<void>;
  updateItem: (
    id: string,
    input: Partial<PantryItemInput>
  ) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
} {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [householdId, setHouseholdId] = useState<string | null>(null);

  const refresh = useCallback(async (hid: string) => {
    try {
      const list = await getAllPantryItems(hid);
      setItems(list);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pantry items');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const household = await getOrCreateDefaultHousehold();
        if (cancelled) return;
        setHouseholdId(household.id);
        await refresh(household.id);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load household'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const addItem = useCallback(
    async (input: PantryItemInput) => {
      if (householdId === null) return;
      await createPantryItem(householdId, input);
      await refresh(householdId);
    },
    [householdId, refresh]
  );

  const updateItem = useCallback(
    async (id: string, input: Partial<PantryItemInput>) => {
      if (householdId === null) return;
      await updatePantryItem(id, householdId, input);
      await refresh(householdId);
    },
    [householdId, refresh]
  );

  const removeItem = useCallback(
    async (id: string) => {
      if (householdId === null) return;
      await deletePantryItem(id, householdId);
      await refresh(householdId);
    },
    [householdId, refresh]
  );

  return {
    items,
    loading,
    error,
    addItem,
    updateItem,
    removeItem,
  };
}
