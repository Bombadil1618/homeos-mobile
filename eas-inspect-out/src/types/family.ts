export type AgeGroup = 'adult' | 'child';

export interface FamilyMember {
  id: string;
  householdId: string;
  userId: string | null;
  name: string;
  ageGroup: AgeGroup;
  dietaryRestrictions: string[];
  allergies: string[];
  favoriteMeals: string[];
  healthPreferences: string[];
  foodDislikes: string[];
  includedInMealPlanning: boolean;
  cookingSkillLevel: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyMemberInput {
  name: string;
  ageGroup: AgeGroup;
  dietaryRestrictions?: string[];
  allergies?: string[];
  favoriteMeals?: string[];
  healthPreferences?: string[];
  foodDislikes?: string[];
  includedInMealPlanning?: boolean;
  cookingSkillLevel?: string | null;
}
