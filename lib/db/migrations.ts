import { type SQLiteDatabase } from 'expo-sqlite';

const SCHEMA_VERSION = 1;

export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion >= SCHEMA_VERSION) {
    return;
  }

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      google_books_id TEXT UNIQUE,
      title TEXT NOT NULL,
      authors TEXT NOT NULL DEFAULT '[]',
      genres TEXT NOT NULL DEFAULT '[]',
      thumbnail_url TEXT,
      description TEXT,
      published_date TEXT,
      page_count INTEGER,
      status TEXT NOT NULL DEFAULT 'to_read'
        CHECK (status IN ('to_read', 'reading', 'read', 'dnf')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_books_title ON books (title COLLATE NOCASE);
    CREATE INDEX IF NOT EXISTS idx_books_status ON books (status);
  `);

  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}
