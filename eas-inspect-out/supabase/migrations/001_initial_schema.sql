-- Initial schema for HomeOS mobile (matches local SQLite structure).
-- Tables: households, household_members, family_members, pantry_items.
-- Row Level Security: users can only read/write rows where household_id matches a household they belong to (via household_members).

-- Households
CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Links users to households (user_id from auth, e.g. auth.uid() or external id)
CREATE TABLE IF NOT EXISTS household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(household_id, user_id)
);

-- Family members (profiles within a household)
CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT,
  date_of_birth TEXT,
  allergies TEXT NOT NULL DEFAULT '[]',
  dietary_restrictions TEXT NOT NULL DEFAULT '[]',
  favorite_meals TEXT NOT NULL DEFAULT '[]',
  include_in_meal_planning BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pantry items
CREATE TABLE IF NOT EXISTS pantry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity TEXT NOT NULL,
  unit TEXT NOT NULL,
  expiry_date TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_household_members_household_id ON household_members(household_id);
CREATE INDEX IF NOT EXISTS idx_household_members_user_id ON household_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_household_id ON family_members(household_id);
CREATE INDEX IF NOT EXISTS idx_pantry_items_household_id ON pantry_items(household_id);

-- Enable Row Level Security on all tables
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;

-- Helper: household_ids the current user is a member of (auth.uid() as text to match user_id)
CREATE OR REPLACE FUNCTION public.user_household_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT household_id FROM household_members
  WHERE user_id = auth.uid()::text;
$$;

-- RLS: households
CREATE POLICY "households_select" ON households
  FOR SELECT USING (id IN (SELECT public.user_household_ids()));

CREATE POLICY "households_insert" ON households
  FOR INSERT WITH CHECK (true);

CREATE POLICY "households_update" ON households
  FOR UPDATE USING (id IN (SELECT public.user_household_ids()));

CREATE POLICY "households_delete" ON households
  FOR DELETE USING (id IN (SELECT public.user_household_ids()));

-- RLS: household_members
CREATE POLICY "household_members_select" ON household_members
  FOR SELECT USING (household_id IN (SELECT public.user_household_ids()));

CREATE POLICY "household_members_insert" ON household_members
  FOR INSERT WITH CHECK (
    household_id IN (SELECT public.user_household_ids())
    OR user_id = auth.uid()::text
  );

CREATE POLICY "household_members_update" ON household_members
  FOR UPDATE USING (household_id IN (SELECT public.user_household_ids()));

CREATE POLICY "household_members_delete" ON household_members
  FOR DELETE USING (household_id IN (SELECT public.user_household_ids()));

-- RLS: family_members
CREATE POLICY "family_members_select" ON family_members
  FOR SELECT USING (household_id IN (SELECT public.user_household_ids()));

CREATE POLICY "family_members_insert" ON family_members
  FOR INSERT WITH CHECK (household_id IN (SELECT public.user_household_ids()));

CREATE POLICY "family_members_update" ON family_members
  FOR UPDATE USING (household_id IN (SELECT public.user_household_ids()));

CREATE POLICY "family_members_delete" ON family_members
  FOR DELETE USING (household_id IN (SELECT public.user_household_ids()));

-- RLS: pantry_items
CREATE POLICY "pantry_items_select" ON pantry_items
  FOR SELECT USING (household_id IN (SELECT public.user_household_ids()));

CREATE POLICY "pantry_items_insert" ON pantry_items
  FOR INSERT WITH CHECK (household_id IN (SELECT public.user_household_ids()));

CREATE POLICY "pantry_items_update" ON pantry_items
  FOR UPDATE USING (household_id IN (SELECT public.user_household_ids()));

CREATE POLICY "pantry_items_delete" ON pantry_items
  FOR DELETE USING (household_id IN (SELECT public.user_household_ids()));
