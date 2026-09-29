import { type SQLiteDatabase } from 'expo-sqlite';

const SCHEMA_VERSION = 8;

const MIGRATIONS: Record<number, string> = {
  1: `
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
  `,
  2: `
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `,
  3: `
    ALTER TABLE books ADD COLUMN publisher TEXT;
    ALTER TABLE books ADD COLUMN language TEXT;
  `,
  4: `
    ALTER TABLE books ADD COLUMN subtitle TEXT;
  `,
  5: `
    ALTER TABLE books ADD COLUMN notes TEXT;
  `,
  6: `
    ALTER TABLE books ADD COLUMN manual_genres TEXT NOT NULL DEFAULT '[]';
  `,
  7: `
    CREATE TABLE IF NOT EXISTS genre_translations (
      locale TEXT NOT NULL,
      genre TEXT NOT NULL,
      translation TEXT NOT NULL,
      PRIMARY KEY (locale, genre)
    );
  `,
  8: `
    ALTER TABLE books ADD COLUMN isbn13 TEXT;
    ALTER TABLE books ADD COLUMN isbn10 TEXT;

    CREATE INDEX IF NOT EXISTS idx_books_isbn13 ON books (isbn13);
  `,
};

export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = result?.user_version ?? 0;

  for (let version = currentVersion + 1; version <= SCHEMA_VERSION; version++) {
    const step = MIGRATIONS[version];
    if (!step) continue;

    await db.execAsync(step);
    await db.execAsync(`PRAGMA user_version = ${version}`);
  }
}
