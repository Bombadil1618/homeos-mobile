import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FamilyMemberModal } from '@/components/FamilyMemberModal';
import { useFamilyMembers } from '@/src/hooks/useFamilyMembers';
import type { FamilyMember, FamilyMemberInput } from '@/src/types/family';

function FamilyMemberCard({
  member,
  onEdit,
  onDelete,
}: {
  member: FamilyMember;
  onEdit: (member: FamilyMember) => void;
  onDelete: (member: FamilyMember) => void;
}) {
  const hasAllergies = member.allergies.length > 0;
  const hasDietary = member.dietaryRestrictions.length > 0;
  const hasFavoriteMeals = (member.favoriteMeals ?? []).length > 0;

  return (
    <View style={[styles.card, styles.cardBorder, styles.cardBg]}>
      <Text style={[styles.cardName, styles.textPrimary]}>{member.name}</Text>

      <View style={styles.badgeRow}>
        <View
          style={[
            styles.badge,
            member.ageGroup === 'adult' ? styles.badgeAdult : styles.badgeChild,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              member.ageGroup === 'adult' ? styles.badgeTextAdult : styles.badgeTextChild,
            ]}
          >
            {member.ageGroup === 'adult' ? 'Adult' : 'Child'}
          </Text>
        </View>
      </View>

      {hasAllergies && (
        <View style={styles.tagsRow}>
          {member.allergies.map((a) => (
            <View key={a} style={styles.allergyTag}>
              <Text style={styles.allergyTagText}>{a}</Text>
            </View>
          ))}
        </View>
      )}

      {hasDietary && (
        <View style={styles.tagsRow}>
          {member.dietaryRestrictions.map((d) => (
            <View key={d} style={styles.dietaryTag}>
              <Text style={styles.dietaryTagText}>{d}</Text>
            </View>
          ))}
        </View>
      )}

      {hasFavoriteMeals && (
        <View style={styles.tagsRow}>
          {(member.favoriteMeals ?? []).map((m) => (
            <View key={m} style={styles.favoriteMealTag}>
              <Text style={styles.favoriteMealTagText}>{m}</Text>
            </View>
          ))}
        </View>
      )}

      {!member.includedInMealPlanning && (
        <Text style={styles.mealPlanNote}>Not included in meal planning</Text>
      )}

      <View style={styles.cardActions}>
        <Pressable onPress={() => onEdit(member)} style={[styles.actionBtn, styles.editBtn]}>
          <Ionicons name="pencil" size={18} color="#374151" />
          <Text style={styles.editBtnText}>Edit</Text>
        </Pressable>
        <Pressable onPress={() => onDelete(member)} style={[styles.actionBtn, styles.deleteBtn]}>
          <Ionicons name="trash-outline" size={18} color="#B91C1C" />
          <Text style={styles.deleteBtnText}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function FamilyProfilesScreen() {
  const insets = useSafeAreaInsets();
  const {
    members,
    loading,
    error,
    addMember,
    updateMember,
    removeMember,
  } = useFamilyMembers();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

  const openAddModal = useCallback(() => {
    setEditingMember(null);
    setModalMode('add');
    setModalVisible(true);
  }, []);

  const openEditModal = useCallback((member: FamilyMember) => {
    setEditingMember(member);
    setModalMode('edit');
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setEditingMember(null);
  }, []);

  const handleSaveAdd = useCallback(
    async (input: FamilyMemberInput) => {
      await addMember(input);
    },
    [addMember]
  );

  const handleSaveEdit = useCallback(
    async (id: string, input: Partial<FamilyMemberInput>) => {
      await updateMember(id, input);
    },
    [updateMember]
  );

  const handleDeletePress = useCallback(
    (member: FamilyMember) => {
      Alert.alert(
        'Delete family member?',
        `Delete ${member.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => removeMember(member.id),
          },
        ]
      );
    },
    [removeMember]
  );

  const renderItem = useCallback(
    ({ item }: { item: FamilyMember }) => (
      <FamilyMemberCard
        member={item}
        onEdit={openEditModal}
        onDelete={handleDeletePress}
      />
    ),
    [openEditModal, handleDeletePress]
  );

  const keyExtractor = useCallback((item: FamilyMember) => item.id, []);

  if (loading) {
    return (
      <View style={[styles.screen, styles.screenBg]}>
        <ActivityIndicator size="large" color="#14B8A6" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.screen, styles.screenBg, styles.errorContainer]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const fabBottom = insets.bottom + 60;

  return (
    <View style={[styles.screen, styles.screenBg]}>
      {members.length === 0 ? (
        <View style={[styles.emptyContainer, styles.screenBg]}>
          <Text style={styles.emptyText}>No family members yet</Text>
          <Pressable onPress={openAddModal} style={styles.addButton}>
            <Text style={styles.addButtonText}>Add Family Member</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={members}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: fabBottom + 24,
          }}
        />
      )}

      <Pressable
        onPress={openAddModal}
        style={[styles.fab, { bottom: fabBottom }]}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>

      <FamilyMemberModal
        visible={modalVisible}
        mode={modalMode}
        member={editingMember}
        onSave={handleSaveAdd}
        onSaveEdit={handleSaveEdit}
        onCancel={closeModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  screenBg: {
    backgroundColor: '#FFFFFF',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#DC2626',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 18,
    color: '#4B5563',
  },
  addButton: {
    marginTop: 24,
    backgroundColor: '#14B8A6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#14B8A6',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  card: {
    marginBottom: 12,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardBorder: {
    borderColor: '#E5E7EB',
  },
  cardBg: {
    backgroundColor: '#FFFFFF',
  },
  cardName: {
    fontSize: 20,
    fontWeight: '600',
  },
  textPrimary: {
    color: '#111827',
  },
  badgeRow: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  badgeAdult: {
    backgroundColor: '#CCFBF1',
  },
  badgeChild: {
    backgroundColor: '#FEF3C7',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  badgeTextAdult: {
    color: '#115E59',
  },
  badgeTextChild: {
    color: '#92400E',
  },
  tagsRow: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  allergyTag: {
    backgroundColor: '#FEE2E2',
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  allergyTagText: {
    fontSize: 12,
    color: '#991B1B',
  },
  dietaryTag: {
    backgroundColor: '#CCFBF1',
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  dietaryTagText: {
    fontSize: 12,
    color: '#115E59',
  },
  favoriteMealTag: {
    backgroundColor: '#FEF3C7',
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  favoriteMealTagText: {
    fontSize: 12,
    color: '#92400E',
  },
  mealPlanNote: {
    marginTop: 8,
    fontSize: 12,
    fontStyle: 'italic',
    color: '#4B5563',
  },
  cardActions: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  editBtn: {
    borderColor: '#D1D5DB',
  },
  deleteBtn: {
    borderColor: '#FECACA',
  },
  editBtnText: {
    fontWeight: '500',
    color: '#374151',
  },
  deleteBtnText: {
    fontWeight: '500',
    color: '#B91C1C',
  },
});
