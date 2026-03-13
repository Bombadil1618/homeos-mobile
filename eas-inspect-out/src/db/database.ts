import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { generateUUID } from './uuid';

const DB_NAME = 'homeos.db';

let dbInstance: SQLiteDatabase | null = null;
let defaultHouseholdId: string | null = null;

/**
 * Returns the singleton database instance. Must be called after initializeDatabase().
 */
export function getDatabase(): SQLiteDatabase {
  if (dbInstance === null) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return dbInstance;
}

/**
 * Opens (or creates) the local SQLite database and creates all tables if they don't exist.
 * Ensures a default household exists and sets schema version to 1.
 */
export async function initializeDatabase(): Promise<void> {
  if (dbInstance === null) {
    dbInstance = await openDatabaseAsync(DB_NAME);
  }

  const db = dbInstance;

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS Household (
      id TEXT PRIMARY KEY,
      name TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS User (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      name TEXT,
      image TEXT,
      householdId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (householdId) REFERENCES Household(id)
    );

    CREATE TABLE IF NOT EXISTS FamilyMember (
      id TEXT PRIMARY KEY,
      householdId TEXT NOT NULL,
      userId TEXT,
      name TEXT NOT NULL,
      ageGroup TEXT NOT NULL,
      dietaryRestrictions TEXT NOT NULL DEFAULT '[]',
      allergies TEXT NOT NULL DEFAULT '[]',
      favoriteMeals TEXT NOT NULL DEFAULT '[]',
      healthPreferences TEXT NOT NULL DEFAULT '[]',
      foodDislikes TEXT NOT NULL DEFAULT '[]',
      includedInMealPlanning INTEGER NOT NULL DEFAULT 1,
      cookingSkillLevel TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (householdId) REFERENCES Household(id),
      FOREIGN KEY (userId) REFERENCES User(id)
    );

    CREATE TABLE IF NOT EXISTS PantryItem (
      id TEXT PRIMARY KEY,
      householdId TEXT NOT NULL,
      name TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      category TEXT NOT NULL,
      expirationDate TEXT,
      notes TEXT,
      isBulk INTEGER NOT NULL DEFAULT 0,
      lowStock INTEGER NOT NULL DEFAULT 0,
      reserved INTEGER NOT NULL DEFAULT 0,
      reservedNote TEXT,
      isBaseline INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (householdId) REFERENCES Household(id)
    );

    CREATE TABLE IF NOT EXISTS ModuleStore (
      id TEXT PRIMARY KEY,
      householdId TEXT,
      module TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      UNIQUE(householdId, module, key),
      FOREIGN KEY (householdId) REFERENCES Household(id)
    );

    CREATE TABLE IF NOT EXISTS db_version (
      version INTEGER NOT NULL
    );
  `);

  const now = new Date().toISOString();

  const existingHousehold = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM Household LIMIT 1'
  );

  if (existingHousehold?.id == null) {
    const newHouseholdId = generateUUID();
    await db.runAsync(
      'INSERT INTO Household (id, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
      newHouseholdId,
      'My Household',
      now,
      now
    );
    defaultHouseholdId = newHouseholdId;
  } else {
    defaultHouseholdId = existingHousehold.id;
  }

  const versionRow = await db.getFirstAsync<{ version: number }>(
    'SELECT version FROM db_version LIMIT 1'
  );
  if (versionRow?.version == null) {
    await db.runAsync('INSERT INTO db_version (version) VALUES (?)', 1);
  }

  // Migration: add favoriteMeals to FamilyMember (v1 -> v2)
  const currentVersion = versionRow?.version ?? 1;
  if (currentVersion < 2) {
    const tableInfo = await db.getAllAsync<{ name: string }>(
      'PRAGMA table_info(FamilyMember)'
    );
    const hasFavoriteMeals = tableInfo.some((c) => c.name === 'favoriteMeals');
    if (!hasFavoriteMeals) {
      await db.execAsync(`
        ALTER TABLE FamilyMember ADD COLUMN favoriteMeals TEXT NOT NULL DEFAULT '[]';
      `);
    }
    await db.runAsync('UPDATE db_version SET version = ?', 2);
  }
}

/**
 * Returns the default household id (set after initializeDatabase()).
 * Returns null if no default household exists (should not happen after init).
 */
export function getDefaultHouseholdId(): string | null {
  return defaultHouseholdId;
}
