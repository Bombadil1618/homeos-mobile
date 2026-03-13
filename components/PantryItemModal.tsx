import DateTimePicker from '@react-native-community/datetimepicker';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  type PantryItem,
  type PantryItemInput,
  PANTRY_CATEGORIES,
  PANTRY_UNITS,
} from '@/src/types/pantry';

function formatExpirationDisplay(isoDateStr: string): string {
  if (!isoDateStr || !isoDateStr.trim()) return 'No expiration date';
  const d = new Date(isoDateStr.trim());
  if (Number.isNaN(d.getTime())) return 'No expiration date';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function isoDateStringFromDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const TEAL_500 = '#14B8A6';
const GRAY_100 = '#F3F4F6';
const GRAY_300 = '#D1D5DB';
const GRAY_500 = '#6B7280';
const GRAY_700 = '#374151';
const GRAY_900 = '#111827';
const WHITE = '#FFFFFF';

type Props = {
  visible: boolean;
  mode: 'add' | 'edit';
  item: PantryItem | null;
  onSave: (input: PantryItemInput) => Promise<void>;
  onSaveEdit: (id: string, input: Partial<PantryItemInput>) => Promise<void>;
  onCancel: () => void;
};

export function PantryItemModal({
  visible,
  mode,
  item,
  onSave,
  onSaveEdit,
  onCancel,
}: Props) {
  const [name, setName] = useState('');
  const [quantityStr, setQuantityStr] = useState('');
  const [unit, setUnit] = useState<string>('count');
  const [category, setCategory] = useState<string>('Other');
  const [expirationDate, setExpirationDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const resetForm = useCallback(() => {
    setName('');
    setQuantityStr('');
    setUnit('count');
    setCategory('Other');
    setExpirationDate('');
    setNotes('');
    setSaving(false);
    setShowDatePicker(false);
  }, []);

  useEffect(() => {
    if (visible) {
      if (mode === 'edit' && item) {
        setName(item.name);
        setQuantityStr(String(item.quantity));
        setUnit(item.unit);
        setCategory(item.category);
        setExpirationDate(item.expirationDate ?? '');
        setNotes(item.notes ?? '');
      } else {
        resetForm();
      }
    }
  }, [visible, mode, item, resetForm]);

  const handleDateChange = useCallback(
    (_event: unknown, selectedDate: Date | undefined) => {
      setShowDatePicker(Platform.OS === 'ios');
      if (selectedDate != null) {
        setExpirationDate(isoDateStringFromDate(selectedDate));
      }
    },
    []
  );

  const dateForPicker = (() => {
    const d = expirationDate ? new Date(expirationDate) : new Date();
    return Number.isNaN(d.getTime()) ? new Date() : d;
  })();

  const handleSave = useCallback(async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const trimmedQty = quantityStr.trim();
    const q = parseFloat(trimmedQty);
    if (
      trimmedQty === '' ||
      Number.isNaN(q) ||
      q <= 0 ||
      !Number.isFinite(q)
    ) {
      Alert.alert('Invalid quantity', 'Please enter a valid quantity');
      return;
    }

    setSaving(true);
    try {
      const input: PantryItemInput = {
        name: trimmedName,
        quantity: q,
        unit,
        category,
        expirationDate: expirationDate.trim() || null,
        notes: notes.trim() || null,
        isBulk: mode === 'add' ? false : (item?.isBulk ?? false),
        lowStock: mode === 'add' ? false : (item?.lowStock ?? false),
      };

      if (mode === 'add') {
        await onSave(input);
      } else if (item) {
        await onSaveEdit(item.id, input);
      }
      resetForm();
      onCancel();
    } finally {
      setSaving(false);
    }
  }, [
    name,
    quantityStr,
    unit,
    category,
    expirationDate,
    notes,
    mode,
    item,
    onSave,
    onSaveEdit,
    onCancel,
    resetForm,
  ]);

  if (!visible) return null;

  const title = mode === 'add' ? 'Add Pantry Item' : 'Edit Pantry Item';
  const nameEmpty = !name.trim();
  const quantityEmpty = quantityStr.trim() === '' || Number.isNaN(parseFloat(quantityStr.trim()));
  const saveDisabled = saving || nameEmpty || quantityEmpty;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onCancel}
    >
      <View style={[styles.backdrop, styles.backdropBg]}>
        <View style={[styles.modalCard, styles.modalCardBg]}>
          <View style={[styles.header, styles.headerBorder]}>
            <Text style={[styles.title, styles.titleColor]}>{title}</Text>
          </View>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.formBlock}>
              <Text style={[styles.label, styles.labelColor]}>Name *</Text>
              <TextInput
                style={[styles.input, styles.inputBorder, styles.inputBg, styles.inputText]}
                placeholder="Item name (e.g. Chicken breast)"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
                editable={!saving}
              />
            </View>

            <View style={styles.formBlock}>
              <Text style={[styles.label, styles.labelColor]}>Quantity *</Text>
              <TextInput
                style={[styles.input, styles.inputBorder, styles.inputBg, styles.inputText]}
                placeholder="Quantity"
                placeholderTextColor="#9CA3AF"
                value={quantityStr}
                onChangeText={setQuantityStr}
                keyboardType="decimal-pad"
                editable={!saving}
              />
            </View>

            <View style={styles.formBlock}>
              <Text style={[styles.label, styles.labelColor]}>Unit</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipScrollContent}
              >
                {PANTRY_UNITS.map((u) => {
                  const selected = unit === u;
                  return (
                    <Pressable
                      key={u}
                      onPress={() => setUnit(u)}
                      style={[
                        styles.chip,
                        selected ? styles.chipSelected : styles.chipUnselected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          selected ? styles.chipTextSelected : styles.chipTextUnselected,
                        ]}
                      >
                        {u}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.formBlock}>
              <Text style={[styles.label, styles.labelColor]}>Category</Text>
              <View style={styles.chipRow}>
                {PANTRY_CATEGORIES.map((cat) => {
                  const selected = category === cat;
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => setCategory(cat)}
                      style={[
                        styles.chip,
                        selected ? styles.chipSelected : styles.chipUnselected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          selected ? styles.chipTextSelected : styles.chipTextUnselected,
                        ]}
                        numberOfLines={1}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.formBlock}>
              <Text style={[styles.label, styles.labelColor]}>Expiration date</Text>
              <View style={styles.dateRow}>
                <Pressable
                  onPress={() => !saving && setShowDatePicker(true)}
                  style={[styles.datePressable, styles.inputBorder, styles.inputBg]}
                >
                  <Text style={[styles.datePressableText, expirationDate ? styles.inputText : styles.datePlaceholder]}>
                    {formatExpirationDisplay(expirationDate)}
                  </Text>
                </Pressable>
                {expirationDate ? (
                  <Pressable
                    onPress={() => !saving && setExpirationDate('')}
                    style={styles.clearDateButton}
                  >
                    <Text style={styles.clearDateText}>Clear</Text>
                  </Pressable>
                ) : null}
              </View>
              {showDatePicker && (
                <DateTimePicker
                  value={dateForPicker}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}
              {Platform.OS === 'ios' && showDatePicker && (
                <Pressable onPress={() => setShowDatePicker(false)} style={styles.datePickerDone}>
                  <Text style={styles.datePickerDoneText}>Done</Text>
                </Pressable>
              )}
            </View>

            <View style={styles.formBlock}>
              <Text style={[styles.label, styles.labelColor]}>Notes</Text>
              <TextInput
                style={[styles.input, styles.inputBorder, styles.inputBg, styles.inputText, styles.notesInput]}
                placeholder="Optional notes"
                placeholderTextColor="#9CA3AF"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                editable={!saving}
              />
            </View>

            <View style={styles.buttonRow}>
              <Pressable
                onPress={onCancel}
                disabled={saving}
                style={[styles.button, styles.cancelButton]}
              >
                <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                disabled={saveDisabled}
                style={[styles.button, saveDisabled ? styles.saveButtonDisabled : styles.saveButton]}
              >
                <Text
                  style={[
                    styles.buttonText,
                    saveDisabled ? styles.saveButtonTextDisabled : styles.saveButtonText,
                  ]}
                >
                  {saving ? 'Saving...' : 'Save'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropBg: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalCard: {
    maxHeight: '90%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalCardBg: {
    backgroundColor: WHITE,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerBorder: {
    backgroundColor: WHITE,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  titleColor: {
    color: GRAY_900,
  },
  scrollView: {
    maxHeight: '75%',
  },
  scrollContent: {
    paddingBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  formBlock: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  labelColor: {
    color: GRAY_900,
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  inputBorder: {
    borderColor: GRAY_300,
  },
  inputBg: {
    backgroundColor: WHITE,
  },
  inputText: {
    color: GRAY_900,
  },
  notesInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  chipScrollContent: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 9999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipUnselected: {
    backgroundColor: GRAY_100,
    borderColor: GRAY_300,
  },
  chipSelected: {
    backgroundColor: TEAL_500,
    borderColor: TEAL_500,
  },
  chipText: {
    fontSize: 14,
  },
  chipTextSelected: {
    color: WHITE,
    fontWeight: '500',
  },
  chipTextUnselected: {
    color: GRAY_700,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  datePressable: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  datePressableText: {
    fontSize: 16,
  },
  datePlaceholder: {
    color: '#9CA3AF',
  },
  clearDateButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  clearDateText: {
    fontSize: 14,
    color: GRAY_700,
    fontWeight: '500',
  },
  datePickerDone: {
    marginTop: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  datePickerDoneText: {
    fontSize: 16,
    color: TEAL_500,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: GRAY_100,
  },
  cancelButtonText: {
    color: GRAY_700,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: TEAL_500,
  },
  saveButtonDisabled: {
    backgroundColor: GRAY_300,
  },
  saveButtonText: {
    color: WHITE,
    fontWeight: '500',
  },
  saveButtonTextDisabled: {
    color: GRAY_500,
    fontWeight: '500',
  },
  buttonText: {
    fontSize: 16,
  },
});
