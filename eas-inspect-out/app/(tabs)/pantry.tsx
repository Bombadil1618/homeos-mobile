import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PantryItemModal } from '@/components/PantryItemModal';
import { usePantryItems } from '@/src/hooks/usePantryItems';
import type { PantryItem, PantryItemInput } from '@/src/types/pantry';

type PantrySection = {
  title: string;
  data: PantryItem[];
  itemCount: number;
  key: string;
  isFirst: boolean;
};

function buildSections(
  items: PantryItem[],
  expandedCategories: Set<string>
): PantrySection[] {
  const byCategory: Record<string, PantryItem[]> = {};
  for (const item of items) {
    const cat = item.category;
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(item);
  }
  const categories = Object.keys(byCategory).sort();
  return categories.map((title, index) => {
    const sectionItems = byCategory[title];
    const itemCount = sectionItems.length;
    const data = expandedCategories.has(title) ? sectionItems : [];
    return {
      title,
      data,
      itemCount,
      key: title,
      isFirst: index === 0,
    };
  });
}

function formatExpirationDate(dateStr: string | null): string | null {
  if (!dateStr || !dateStr.trim()) return null;
  const d = new Date(dateStr.trim());
  if (Number.isNaN(d.getTime())) return null;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function isExpired(dateStr: string | null): boolean {
  if (!dateStr || !dateStr.trim()) return false;
  const d = new Date(dateStr.trim());
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < today;
}

function PantryItemCard({
  item,
  onEdit,
  onDelete,
}: {
  item: PantryItem;
  onEdit: (item: PantryItem) => void;
  onDelete: (item: PantryItem) => void;
}) {
  const expFormatted = formatExpirationDate(item.expirationDate);
  const expired = isExpired(item.expirationDate);
  const hasSecondLine =
    !!expFormatted || item.lowStock || item.isBulk || item.isBaseline;

  return (
    <View style={[styles.card, styles.cardBorder, styles.cardBg]}>
      <View style={styles.cardRow}>
        <View style={styles.cardLeft}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.name}
            <Text style={styles.cardQty}> — {item.quantity} {item.unit}</Text>
          </Text>
        </View>
        <View style={[styles.badge, styles.badgeCategory]}>
          <Text style={styles.badgeCategoryText} numberOfLines={1}>{item.category}</Text>
        </View>
        <View style={styles.cardActions}>
          <Pressable onPress={() => onEdit(item)} style={styles.iconBtn} hitSlop={8}>
            <Ionicons name="pencil" size={20} color="#374151" />
          </Pressable>
          <Pressable onPress={() => onDelete(item)} style={styles.iconBtn} hitSlop={8}>
            <Ionicons name="trash-outline" size={20} color="#B91C1C" />
          </Pressable>
        </View>
      </View>
      {hasSecondLine && (
        <View style={styles.secondLine}>
          {expFormatted && (
            <Text
              style={[styles.metaText, expired ? styles.expirationExpired : styles.expirationNormal]}
              numberOfLines={1}
            >
              {expired ? 'Expired: ' : 'Expires: '}{expFormatted}
            </Text>
          )}
          {item.lowStock && (
            <View style={[styles.tinyBadge, styles.badgeLowStock]}>
              <Text style={styles.badgeLowStockText}>Low Stock</Text>
            </View>
          )}
          {item.isBulk && (
            <View style={[styles.tinyBadge, styles.badgeBulk]}>
              <Text style={styles.badgeBulkText}>Bulk</Text>
            </View>
          )}
          {item.isBaseline && (
            <View style={[styles.tinyBadge, styles.badgeBaseline]}>
              <Text style={styles.badgeBaselineText}>Baseline</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export default function PantryScreen() {
  const insets = useSafeAreaInsets();
  const {
    items,
    loading,
    error,
    addItem,
    updateItem,
    removeItem,
  } = usePantryItems();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    () => new Set()
  );
  const previousCategoriesRef = useRef<Set<string>>(new Set());

  const sections = useMemo(
    () => buildSections(items, expandedCategories),
    [items, expandedCategories]
  );

  useEffect(() => {
    if (items.length === 0) return;
    const currentCategories = new Set(items.map((i) => i.category));
    const previous = previousCategoriesRef.current;
    if (previous.size === 0) {
      previousCategoriesRef.current = new Set(currentCategories);
      return;
    }
    const newCategories = [...currentCategories].filter((c) => !previous.has(c));
    if (newCategories.length > 0) {
      setExpandedCategories((prev) => {
        const next = new Set(prev);
        newCategories.forEach((c) => next.add(c));
        return next;
      });
    }
    previousCategoriesRef.current = new Set(currentCategories);
  }, [items]);

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }, []);

  const openAddModal = useCallback(() => {
    setEditingItem(null);
    setModalMode('add');
    setModalVisible(true);
  }, []);

  const openEditModal = useCallback((item: PantryItem) => {
    setEditingItem(item);
    setModalMode('edit');
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setEditingItem(null);
  }, []);

  const handleSaveAdd = useCallback(
    async (input: PantryItemInput) => {
      await addItem(input);
    },
    [addItem]
  );

  const handleSaveEdit = useCallback(
    async (id: string, input: Partial<PantryItemInput>) => {
      await updateItem(id, input);
    },
    [updateItem]
  );

  const handleDeletePress = useCallback(
    (item: PantryItem) => {
      Alert.alert(
        'Delete pantry item?',
        `Delete ${item.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => removeItem(item.id),
          },
        ]
      );
    },
    [removeItem]
  );

  const renderItem = useCallback(
    ({ item }: { item: PantryItem }) => (
      <PantryItemCard
        item={item}
        onEdit={openEditModal}
        onDelete={handleDeletePress}
      />
    ),
    [openEditModal, handleDeletePress]
  );

  const keyExtractor = useCallback((item: PantryItem) => item.id, []);

  const renderSectionHeader = useCallback(
    ({ section }: { section: PantrySection }) => {
      const isExpanded = expandedCategories.has(section.title);
      return (
        <Pressable
          style={[styles.sectionHeader, section.isFirst && styles.sectionHeaderFirst]}
          onPress={() => toggleCategory(section.title)}
        >
          <Text style={styles.sectionHeaderTitle} numberOfLines={1}>
            {section.title} ({section.itemCount})
          </Text>
          <Ionicons
            name={isExpanded ? 'chevron-down' : 'chevron-forward'}
            size={22}
            color="#6B7280"
          />
        </Pressable>
      );
    },
    [expandedCategories, toggleCategory]
  );

  const ItemSeparator = useCallback(
    () => <View style={styles.separator} />,
    []
  );

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
      {items.length === 0 ? (
        <View style={[styles.emptyContainer, styles.screenBg]}>
          <Text style={styles.emptyText}>Your pantry is empty</Text>
          <Pressable onPress={openAddModal} style={styles.addButton}>
            <Text style={styles.addButtonText}>Add Item</Text>
          </Pressable>
        </View>
      ) : (
        <SectionList
          sections={sections}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={keyExtractor}
          ItemSeparatorComponent={ItemSeparator}
          stickySectionHeadersEnabled={false}
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

      <PantryItemModal
        visible={modalVisible}
        mode={modalMode}
        item={editingItem}
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
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    marginTop: 12,
  },
  sectionHeaderFirst: {
    marginTop: 0,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  card: {
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
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
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
  },
  cardLeft: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  cardQty: {
    fontWeight: '400',
    color: '#6B7280',
    fontSize: 15,
  },
  badge: {
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeCategory: {
    backgroundColor: '#CCFBF1',
  },
  badgeCategoryText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#115E59',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
  },
  iconBtn: {
    padding: 6,
  },
  secondLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  metaText: {
    fontSize: 11,
  },
  expirationNormal: {
    color: '#6B7280',
  },
  expirationExpired: {
    color: '#DC2626',
    fontWeight: '500',
  },
  tinyBadge: {
    borderRadius: 9999,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeLowStock: {
    backgroundColor: '#FFEDD5',
  },
  badgeLowStockText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9A3412',
  },
  badgeBulk: {
    backgroundColor: '#DBEAFE',
  },
  badgeBulkText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#1E40AF',
  },
  badgeBaseline: {
    backgroundColor: '#F3F4F6',
  },
  badgeBaselineText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#4B5563',
  },
});
