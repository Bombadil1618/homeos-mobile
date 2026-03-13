import { useCallback, useEffect, useState } from 'react';
import {
  createFamilyMember,
  deleteFamilyMember,
  getAllFamilyMembers,
  updateFamilyMember,
} from '@/src/db/familyMembers';
import { getOrCreateDefaultHousehold } from '@/src/db/household';
import type { FamilyMember, FamilyMemberInput } from '@/src/types/family';

export function useFamilyMembers(): {
  members: FamilyMember[];
  loading: boolean;
  error: string | null;
  addMember: (input: FamilyMemberInput) => Promise<void>;
  updateMember: (
    id: string,
    input: Partial<FamilyMemberInput>
  ) => Promise<void>;
  removeMember: (id: string) => Promise<void>;
} {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [householdId, setHouseholdId] = useState<string | null>(null);

  const refresh = useCallback(async (hid: string) => {
    try {
      const list = await getAllFamilyMembers(hid);
      setMembers(list);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load family members');
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

  const addMember = useCallback(
    async (input: FamilyMemberInput) => {
      if (householdId === null) return;
      await createFamilyMember(householdId, input);
      await refresh(householdId);
    },
    [householdId, refresh]
  );

  const updateMember = useCallback(
    async (id: string, input: Partial<FamilyMemberInput>) => {
      if (householdId === null) return;
      await updateFamilyMember(id, householdId, input);
      await refresh(householdId);
    },
    [householdId, refresh]
  );

  const removeMember = useCallback(
    async (id: string) => {
      if (householdId === null) return;
      await deleteFamilyMember(id, householdId);
      await refresh(householdId);
    },
    [householdId, refresh]
  );

  return {
    members,
    loading,
    error,
    addMember,
    updateMember,
    removeMember,
  };
}
