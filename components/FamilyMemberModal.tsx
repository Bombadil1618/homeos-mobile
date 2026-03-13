import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { AgeGroup, FamilyMember, FamilyMemberInput } from '@/src/types/family';

const DIETARY_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'Halal',
  'Kosher',
  'Pescatarian',
  'Keto',
  'Paleo',
  'Nut-Free',
] as const;

const ALLERGY_OPTIONS = [
  'Peanuts',
  'Tree Nuts',
  'Milk',
  'Eggs',
  'Fish',
  'Shellfish',
  'Wheat',
  'Soy',
  'Sesame',
] as const;

const PRESET_DIETARY_SET = new Set<string>(DIETARY_OPTIONS as unknown as string[]);
const PRESET_ALLERGY_SET = new Set<string>(ALLERGY_OPTIONS as unknown as string[]);

const TEAL_500 = '#14B8A6';
const RED_500 = '#EF4444';
const AMBER_500 = '#F59E0B';
const GRAY_100 = '#F3F4F6';
const GRAY_300 = '#D1D5DB';
const GRAY_500 = '#6B7280';
const GRAY_700 = '#374151';
const GRAY_900 = '#111827';
const WHITE = '#FFFFFF';

type Props = {
  visible: boolean;
  mode: 'add' | 'edit';
  member: FamilyMember | null;
  onSave: (input: FamilyMemberInput) => Promise<void>;
  onSaveEdit: (id: string, input: Partial<FamilyMemberInput>) => Promise<void>;
  onCancel: () => void;
};

export function FamilyMemberModal({
  visible,
  mode,
  member,
  onSave,
  onSaveEdit,
  onCancel,
}: Props) {
  const [name, setName] = useState('');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('adult');
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [favoriteMeals, setFavoriteMeals] = useState<string[]>([]);
  const [customDietaryInput, setCustomDietaryInput] = useState('');
  const [customAllergyInput, setCustomAllergyInput] = useState('');
  const [favoriteMealsInput, setFavoriteMealsInput] = useState('');
  const [foodDislikes, setFoodDislikes] = useState<string[]>([]);
  const [foodDislikesInput, setFoodDislikesInput] = useState('');
  const [includedInMealPlanning, setIncludedInMealPlanning] = useState(true);
  const [saving, setSaving] = useState(false);

  const resetForm = useCallback(() => {
    setName('');
    setAgeGroup('adult');
    setDietaryRestrictions([]);
    setAllergies([]);
    setFavoriteMeals([]);
    setCustomDietaryInput('');
    setCustomAllergyInput('');
    setFavoriteMealsInput('');
    setFoodDislikes([]);
    setFoodDislikesInput('');
    setIncludedInMealPlanning(true);
    setSaving(false);
  }, []);

  const customDietary = dietaryRestrictions.filter((x) => !PRESET_DIETARY_SET.has(x));
  const customAllergies = allergies.filter((x) => !PRESET_ALLERGY_SET.has(x));

  const addCustomDietary = useCallback(() => {
    const value = customDietaryInput.trim();
    if (!value) return;
    const lower = value.toLowerCase();
    const isDuplicate = dietaryRestrictions.some((x) => x.toLowerCase() === lower);
    if (isDuplicate) return;
    setDietaryRestrictions((prev) => [...prev, value]);
    setCustomDietaryInput('');
  }, [customDietaryInput, dietaryRestrictions]);

  const removeCustomDietary = useCallback((value: string) => {
    setDietaryRestrictions((prev) => prev.filter((x) => x !== value));
  }, []);

  const addCustomAllergy = useCallback(() => {
    const value = customAllergyInput.trim();
    if (!value) return;
    const lower = value.toLowerCase();
    const isDuplicate = allergies.some((x) => x.toLowerCase() === lower);
    if (isDuplicate) return;
    setAllergies((prev) => [...prev, value]);
    setCustomAllergyInput('');
  }, [customAllergyInput, allergies]);

  const removeCustomAllergy = useCallback((value: string) => {
    setAllergies((prev) => prev.filter((x) => x !== value));
  }, []);

  const addFavoriteMeal = useCallback(() => {
    const value = favoriteMealsInput.trim();
    if (!value) return;
    const lower = value.toLowerCase();
    const isDuplicate = favoriteMeals.some((x) => x.toLowerCase() === lower);
    if (isDuplicate) return;
    setFavoriteMeals((prev) => [...prev, value]);
    setFavoriteMealsInput('');
  }, [favoriteMealsInput, favoriteMeals]);

  const removeFavoriteMeal = useCallback((value: string) => {
    setFavoriteMeals((prev) => prev.filter((x) => x !== value));
  }, []);

  const addFoodDislike = useCallback(() => {
    const value = foodDislikesInput.trim();
    if (!value) return;
    const lower = value.toLowerCase();
    const isDuplicate = foodDislikes.some((x) => x.toLowerCase() === lower);
    if (isDuplicate) return;
    setFoodDislikes((prev) => [...prev, value]);
    setFoodDislikesInput('');
  }, [foodDislikesInput, foodDislikes]);

  const removeFoodDislike = useCallback((value: string) => {
    setFoodDislikes((prev) => prev.filter((x) => x !== value));
  }, []);

  useEffect(() => {
    if (visible) {
      if (mode === 'edit' && member) {
        setName(member.name);
        setAgeGroup(member.ageGroup);
        setDietaryRestrictions(member.dietaryRestrictions ?? []);
        setAllergies(member.allergies ?? []);
        setFavoriteMeals(member.favoriteMeals ?? []);
        setFoodDislikes(member.foodDislikes ?? []);
        setFoodDislikesInput('');
        setIncludedInMealPlanning(member.includedInMealPlanning);
      } else {
        resetForm();
      }
    }
  }, [visible, mode, member, resetForm]);

  const toggleDietary = useCallback((option: string) => {
    setDietaryRestrictions((prev) =>
      prev.includes(option) ? prev.filter((x) => x !== option) : [...prev, option]
    );
  }, []);

  const toggleAllergy = useCallback((option: string) => {
    setAllergies((prev) =>
      prev.includes(option) ? prev.filter((x) => x !== option) : [...prev, option]
    );
  }, []);

  const handleSave = useCallback(async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setSaving(true);
    try {
      if (mode === 'add') {
        await onSave({
          name: trimmedName,
          ageGroup,
          dietaryRestrictions,
          allergies,
          favoriteMeals,
          foodDislikes,
          includedInMealPlanning,
        });
      } else if (member) {
        await onSaveEdit(member.id, {
          name: trimmedName,
          ageGroup,
          dietaryRestrictions,
          allergies,
          favoriteMeals,
          foodDislikes,
          includedInMealPlanning,
        });
      }
      resetForm();
      onCancel();
    } finally {
      setSaving(false);
    }
  }, [
    name,
    ageGroup,
    dietaryRestrictions,
    allergies,
    favoriteMeals,
    foodDislikes,
    includedInMealPlanning,
    mode,
    member,
    onSave,
    onSaveEdit,
    onCancel,
    resetForm,
  ]);

  if (!visible) return null;

  const title = mode === 'add' ? 'Add Family Member' : 'Edit Family Member';
  const saveDisabled = saving || !name.trim();

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
                placeholder="Family member name"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
                editable={!saving}
              />
            </View>

            <View style={styles.formBlock}>
              <Text style={[styles.label, styles.labelColor]}>Age group</Text>
              <View style={styles.ageRow}>
                <Pressable
                  onPress={() => setAgeGroup('adult')}
                  style={[
                    styles.ageButton,
                    ageGroup === 'adult' ? styles.ageButtonSelected : styles.ageButtonUnselected,
                  ]}
                >
                  <Text
                    style={[
                      styles.ageButtonText,
                      ageGroup === 'adult' ? styles.ageButtonTextSelected : styles.ageButtonTextUnselected,
                    ]}
                  >
                    Adult
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setAgeGroup('child')}
                  style={[
                    styles.ageButton,
                    ageGroup === 'child' ? styles.ageButtonSelected : styles.ageButtonUnselected,
                  ]}
                >
                  <Text
                    style={[
                      styles.ageButtonText,
                      ageGroup === 'child' ? styles.ageButtonTextSelected : styles.ageButtonTextUnselected,
                    ]}
                  >
                    Child
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.formBlock}>
              <Text style={[styles.label, styles.labelColor]}>Dietary restrictions</Text>
              <View style={styles.addRow}>
                <TextInput
                  style={[styles.addInput, styles.inputBorder, styles.inputBg, styles.inputText]}
                  placeholder="Add custom restriction (e.g. No Beef)"
                  placeholderTextColor="#9CA3AF"
                  value={customDietaryInput}
                  onChangeText={setCustomDietaryInput}
                  onSubmitEditing={addCustomDietary}
                  returnKeyType="done"
                  editable={!saving}
                />
                <Pressable
                  onPress={addCustomDietary}
                  disabled={saving}
                  style={[styles.addButton, styles.addButtonDietary]}
                >
                  <Text style={styles.addButtonText}>Add</Text>
                </Pressable>
              </View>
              <View style={[styles.chipRow, styles.chipRowBelowAdd]}>
                {DIETARY_OPTIONS.map((opt) => {
                  const selected = dietaryRestrictions.includes(opt);
                  return (
                    <Pressable
                      key={opt}
                      onPress={() => toggleDietary(opt)}
                      style={[
                        styles.chip,
                        selected ? styles.chipDietarySelected : styles.chipUnselected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          selected ? styles.chipTextSelected : styles.chipTextUnselected,
                        ]}
                      >
                        {opt}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {customDietary.length > 0 && (
                <View style={[styles.chipRow, styles.customChipsTop]}>
                  {customDietary.map((value) => (
                    <View
                      key={value}
                      style={[styles.chip, styles.chipDietarySelected, styles.customChip]}
                    >
                      <Text style={[styles.chipText, styles.chipTextSelected]} numberOfLines={1}>
                        {value}
                      </Text>
                      <Pressable
                        onPress={() => removeCustomDietary(value)}
                        hitSlop={8}
                        style={styles.chipRemove}
                      >
                        <Ionicons name="close" size={14} color={WHITE} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.formBlock}>
              <Text style={[styles.label, styles.labelColor]}>Allergies</Text>
              <View style={styles.addRow}>
                <TextInput
                  style={[styles.addInput, styles.inputBorder, styles.inputBg, styles.inputText]}
                  placeholder="Add custom allergy (e.g. Kiwi)"
                  placeholderTextColor="#9CA3AF"
                  value={customAllergyInput}
                  onChangeText={setCustomAllergyInput}
                  onSubmitEditing={addCustomAllergy}
                  returnKeyType="done"
                  editable={!saving}
                />
                <Pressable
                  onPress={addCustomAllergy}
                  disabled={saving}
                  style={[styles.addButton, styles.addButtonAllergy]}
                >
                  <Text style={styles.addButtonText}>Add</Text>
                </Pressable>
              </View>
              <View style={[styles.chipRow, styles.chipRowBelowAdd]}>
                {ALLERGY_OPTIONS.map((opt) => {
                  const selected = allergies.includes(opt);
                  return (
                    <Pressable
                      key={opt}
                      onPress={() => toggleAllergy(opt)}
                      style={[
                        styles.chip,
                        selected ? styles.chipAllergySelected : styles.chipUnselected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          selected ? styles.chipTextSelected : styles.chipTextUnselected,
                        ]}
                      >
                        {opt}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {customAllergies.length > 0 && (
                <View style={[styles.chipRow, styles.customChipsTop]}>
                  {customAllergies.map((value) => (
                    <View
                      key={value}
                      style={[styles.chip, styles.chipAllergySelected, styles.customChip]}
                    >
                      <Text style={[styles.chipText, styles.chipTextSelected]} numberOfLines={1}>
                        {value}
                      </Text>
                      <Pressable
                        onPress={() => removeCustomAllergy(value)}
                        hitSlop={8}
                        style={styles.chipRemove}
                      >
                        <Ionicons name="close" size={14} color={WHITE} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.formBlock}>
              <Text style={[styles.label, styles.labelColor]}>Favorite Meals</Text>
              <View style={styles.addRow}>
                <TextInput
                  style={[styles.addInput, styles.inputBorder, styles.inputBg, styles.inputText]}
                  placeholder="e.g. Tacos, Mac and Cheese, Stir Fry"
                  placeholderTextColor="#9CA3AF"
                  value={favoriteMealsInput}
                  onChangeText={setFavoriteMealsInput}
                  onSubmitEditing={addFavoriteMeal}
                  returnKeyType="done"
                  editable={!saving}
                />
                <Pressable
                  onPress={addFavoriteMeal}
                  disabled={saving}
                  style={[styles.addButton, styles.addButtonFavorite]}
                >
                  <Text style={styles.addButtonText}>Add</Text>
                </Pressable>
              </View>
              {favoriteMeals.length > 0 && (
                <View style={[styles.chipRow, styles.chipRowBelowAdd]}>
                  {favoriteMeals.map((value) => (
                    <View
                      key={value}
                      style={[styles.chip, styles.chipFavoriteSelected, styles.customChip]}
                    >
                      <Text style={[styles.chipText, styles.chipTextSelected]} numberOfLines={1}>
                        {value}
                      </Text>
                      <Pressable
                        onPress={() => removeFavoriteMeal(value)}
                        hitSlop={8}
                        style={styles.chipRemove}
                      >
                        <Ionicons name="close" size={14} color={WHITE} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.formBlock}>
              <Text style={[styles.label, styles.labelColor]}>Food Dislikes</Text>
              <View style={styles.addRow}>
                <TextInput
                  style={[styles.addInput, styles.inputBorder, styles.inputBg, styles.inputText]}
                  placeholder="e.g. Broccoli, Mushrooms"
                  placeholderTextColor="#9CA3AF"
                  value={foodDislikesInput}
                  onChangeText={setFoodDislikesInput}
                  onSubmitEditing={addFoodDislike}
                  returnKeyType="done"
                  editable={!saving}
                />
                <Pressable
                  onPress={addFoodDislike}
                  disabled={saving}
                  style={[styles.addButton, styles.addButtonFavorite]}
                >
                  <Text style={styles.addButtonText}>Add</Text>
                </Pressable>
              </View>
              {foodDislikes.length > 0 && (
                <View style={[styles.chipRow, styles.chipRowBelowAdd]}>
                  {foodDislikes.map((value) => (
                    <View
                      key={value}
                      style={[styles.chip, styles.chipFavoriteSelected, styles.customChip]}
                    >
                      <Text style={[styles.chipText, styles.chipTextSelected]} numberOfLines={1}>
                        {value}
                      </Text>
                      <Pressable
                        onPress={() => removeFoodDislike(value)}
                        hitSlop={8}
                        style={styles.chipRemove}
                      >
                        <Ionicons name="close" size={14} color={WHITE} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={[styles.formBlock, styles.mealPlanningRow]}>
              <Text style={[styles.label, styles.labelColor, styles.mealPlanningLabel]}>
                Included in meal planning
              </Text>
              <Switch
                value={includedInMealPlanning}
                onValueChange={setIncludedInMealPlanning}
                trackColor={{ false: GRAY_300, true: TEAL_500 }}
                thumbColor={WHITE}
                disabled={saving}
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
  ageRow: {
    flexDirection: 'row',
    gap: 12,
  },
  ageButton: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ageButtonSelected: {
    backgroundColor: TEAL_500,
    borderColor: TEAL_500,
  },
  ageButtonUnselected: {
    backgroundColor: GRAY_100,
    borderColor: GRAY_300,
  },
  ageButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  ageButtonTextSelected: {
    color: WHITE,
  },
  ageButtonTextUnselected: {
    color: GRAY_700,
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
  chipDietarySelected: {
    backgroundColor: TEAL_500,
    borderColor: TEAL_500,
  },
  chipAllergySelected: {
    backgroundColor: RED_500,
    borderColor: RED_500,
  },
  chipFavoriteSelected: {
    backgroundColor: AMBER_500,
    borderColor: AMBER_500,
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
  customChipsTop: {
    marginTop: 4,
  },
  customChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '100%',
  },
  chipRemove: {
    padding: 2,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  chipRowBelowAdd: {
    marginTop: 8,
  },
  addInput: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDietary: {
    backgroundColor: TEAL_500,
  },
  addButtonAllergy: {
    backgroundColor: TEAL_500,
  },
  addButtonFavorite: {
    backgroundColor: AMBER_500,
  },
  addButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '500',
  },
  mealPlanningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mealPlanningLabel: {
    marginBottom: 0,
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
