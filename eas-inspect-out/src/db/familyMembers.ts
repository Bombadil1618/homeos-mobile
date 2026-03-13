import { safeJsonParse } from './utils';
import { generateUUID } from './uuid';
import { powerSyncDb } from '@/src/lib/powersync/database';
import type { FamilyMember, FamilyMemberInput } from '@/src/types/family';

type FamilyMemberRow = {
  id: string;
  household_id: string;
  user_id: string | null;
  name: string;
  relationship: string | null;
  date_of_birth: string | null;
  age_group: string;
  dietary_restrictions: string;
  allergies: string;
  favorite_meals: string;
  health_preferences: string;
  food_dislikes: string;
  include_in_meal_planning: number;
  cooking_skill_level: string | null;
  created_at: string;
  updated_at: string;
};

function rowToFamilyMember(row: FamilyMemberRow): FamilyMember {
  return {
    id: row.id,
    householdId: row.household_id,
    userId: row.user_id,
    name: row.name,
    ageGroup: row.age_group === 'child' ? 'child' : 'adult',
    dietaryRestrictions: safeJsonParse(row.dietary_restrictions),
    allergies: safeJsonParse(row.allergies),
    favoriteMeals: safeJsonParse(row.favorite_meals),
    healthPreferences: safeJsonParse(row.health_preferences),
    foodDislikes: safeJsonParse(row.food_dislikes),
    includedInMealPlanning: row.include_in_meal_planning === 1,
    cookingSkillLevel: row.cooking_skill_level,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const FAMILY_MEMBER_COLS =
  'id, household_id, user_id, name, relationship, date_of_birth, age_group, dietary_restrictions, allergies, favorite_meals, health_preferences, food_dislikes, include_in_meal_planning, cooking_skill_level, created_at, updated_at';

export async function getAllFamilyMembers(
  householdId: string
): Promise<FamilyMember[]> {
  const rows = await powerSyncDb.getAll<FamilyMemberRow>(
    `SELECT ${FAMILY_MEMBER_COLS} FROM family_members WHERE household_id = ? ORDER BY name`,
    [householdId]
  );
  return rows.map(rowToFamilyMember);
}

export async function getFamilyMemberById(
  id: string,
  householdId: string
): Promise<FamilyMember | null> {
  const rows = await powerSyncDb.getAll<FamilyMemberRow>(
    `SELECT ${FAMILY_MEMBER_COLS} FROM family_members WHERE id = ? AND household_id = ?`,
    [id, householdId]
  );
  const row = rows[0];
  return row ? rowToFamilyMember(row) : null;
}

export async function createFamilyMember(
  householdId: string,
  input: FamilyMemberInput
): Promise<FamilyMember> {
  const id = generateUUID();
  const now = new Date().toISOString();
  const dietaryRestrictions = JSON.stringify(input.dietaryRestrictions ?? []);
  const allergies = JSON.stringify(input.allergies ?? []);
  const favoriteMeals = JSON.stringify(input.favoriteMeals ?? []);
  const healthPreferences = JSON.stringify(input.healthPreferences ?? []);
  const foodDislikes = JSON.stringify(input.foodDislikes ?? []);
  const includeInMealPlanning =
    input.includedInMealPlanning !== false ? 1 : 0;

  await powerSyncDb.execute(
    `INSERT INTO family_members (id, household_id, user_id, name, relationship, date_of_birth, age_group, dietary_restrictions, allergies, favorite_meals, health_preferences, food_dislikes, include_in_meal_planning, cooking_skill_level, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      householdId,
      null,
      input.name,
      null,
      null,
      input.ageGroup,
      dietaryRestrictions,
      allergies,
      favoriteMeals,
      healthPreferences,
      foodDislikes,
      includeInMealPlanning,
      input.cookingSkillLevel ?? null,
      now,
      now,
    ]
  );

  const created = await getFamilyMemberById(id, householdId);
  if (!created) throw new Error('Failed to read created family member');
  return created;
}

export async function updateFamilyMember(
  id: string,
  householdId: string,
  input: Partial<FamilyMemberInput>
): Promise<FamilyMember | null> {
  const now = new Date().toISOString();

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (input.name !== undefined) {
    updates.push('name = ?');
    values.push(input.name);
  }
  if (input.ageGroup !== undefined) {
    updates.push('age_group = ?');
    values.push(input.ageGroup);
  }
  if (input.dietaryRestrictions !== undefined) {
    updates.push('dietary_restrictions = ?');
    values.push(JSON.stringify(input.dietaryRestrictions));
  }
  if (input.allergies !== undefined) {
    updates.push('allergies = ?');
    values.push(JSON.stringify(input.allergies));
  }
  if (input.favoriteMeals !== undefined) {
    updates.push('favorite_meals = ?');
    values.push(JSON.stringify(input.favoriteMeals));
  }
  if (input.healthPreferences !== undefined) {
    updates.push('health_preferences = ?');
    values.push(JSON.stringify(input.healthPreferences));
  }
  if (input.foodDislikes !== undefined) {
    updates.push('food_dislikes = ?');
    values.push(JSON.stringify(input.foodDislikes));
  }
  if (input.includedInMealPlanning !== undefined) {
    updates.push('include_in_meal_planning = ?');
    values.push(input.includedInMealPlanning ? 1 : 0);
  }
  if (input.cookingSkillLevel !== undefined) {
    updates.push('cooking_skill_level = ?');
    values.push(input.cookingSkillLevel);
  }

  updates.push('updated_at = ?');
  values.push(now);
  values.push(id, householdId);

  const sql = `UPDATE family_members SET ${updates.join(', ')} WHERE id = ? AND household_id = ?`;
  await powerSyncDb.execute(sql, values);

  return getFamilyMemberById(id, householdId);
}

export async function deleteFamilyMember(
  id: string,
  householdId: string
): Promise<void> {
  await powerSyncDb.execute(
    'DELETE FROM family_members WHERE id = ? AND household_id = ?',
    [id, householdId]
  );
}
