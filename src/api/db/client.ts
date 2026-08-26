import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import { migrateDbIfNeeded } from './migrations';

let dbPromise: Promise<SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openDatabaseAsync('tbr.db').then(async (db) => {
      await migrateDbIfNeeded(db);
      return db;
    });
  }
  return dbPromise;
}
