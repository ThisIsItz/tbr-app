import { getDb } from '@/api/db/client';

export async function getGenreTranslations(
  genres: string[],
  locale: string,
): Promise<Record<string, string>> {
  if (genres.length === 0) return {};

  const db = await getDb();
  const placeholders = genres.map(() => '?').join(', ');
  const rows = await db.getAllAsync<{ genre: string; translation: string }>(
    `SELECT genre, translation FROM genre_translations WHERE locale = ? AND genre IN (${placeholders})`,
    [locale, ...genres],
  );

  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.genre] = row.translation;
  }
  return result;
}

export async function saveGenreTranslations(
  translations: Record<string, string>,
  locale: string,
): Promise<void> {
  const entries = Object.entries(translations);
  if (entries.length === 0) return;

  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const [genre, translation] of entries) {
      await db.runAsync(
        'INSERT OR REPLACE INTO genre_translations (locale, genre, translation) VALUES (?, ?, ?)',
        [locale, genre, translation],
      );
    }
  });
}
