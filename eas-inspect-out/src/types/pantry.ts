export interface PantryItem {
  id: string;
  householdId: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expirationDate: string | null;
  notes: string | null;
  isBulk: boolean;
  lowStock: boolean;
  reserved: boolean;
  reservedNote: string | null;
  isBaseline: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PantryItemInput {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expirationDate?: string | null;
  notes?: string | null;
  isBulk?: boolean;
  lowStock?: boolean;
  reserved?: boolean;
  reservedNote?: string | null;
  isBaseline?: boolean;
}

export const PANTRY_UNITS = [
  'gallon',
  'half gallon',
  'dozen',
  'lbs',
  'oz',
  'g',
  'count',
  'cup',
  'tbsp',
  'tsp',
  'ml',
  'l',
] as const;

export const PANTRY_CATEGORIES = [
  'Produce',
  'Dairy',
  'Meat & Seafood',
  'Frozen',
  'Pantry Staples',
  'Beverages',
  'Snacks',
  'Condiments & Sauces',
  'Baking',
  'Other',
] as const;
