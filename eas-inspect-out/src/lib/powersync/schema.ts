import { column, Schema, Table } from '@powersync/react-native';

const households = new Table({
  id: column.text,
  name: column.text,
  created_at: column.text,
});

const household_members = new Table(
  {
    id: column.text,
    household_id: column.text,
    user_id: column.text,
    role: column.text,
    joined_at: column.text,
  },
  { indexes: { household_members_household_id: ['household_id'], household_members_user_id: ['user_id'] } }
);

const family_members = new Table(
  {
    id: column.text,
    household_id: column.text,
    user_id: column.text,
    name: column.text,
    relationship: column.text,
    date_of_birth: column.text,
    age_group: column.text,
    allergies: column.text,
    dietary_restrictions: column.text,
    favorite_meals: column.text,
    health_preferences: column.text,
    food_dislikes: column.text,
    include_in_meal_planning: column.integer,
    cooking_skill_level: column.text,
    created_at: column.text,
    updated_at: column.text,
  },
  { indexes: { family_members_household_id: ['household_id'] } }
);

const pantry_items = new Table(
  {
    id: column.text,
    household_id: column.text,
    name: column.text,
    category: column.text,
    quantity: column.real,
    unit: column.text,
    expiry_date: column.text,
    notes: column.text,
    is_bulk: column.integer,
    low_stock: column.integer,
    reserved: column.integer,
    reserved_note: column.text,
    is_baseline: column.integer,
    created_at: column.text,
    updated_at: column.text,
  },
  { indexes: { pantry_items_household_id: ['household_id'] } }
);

export const AppSchema = new Schema({
  households,
  household_members,
  family_members,
  pantry_items,
});
