import { randomUUID } from 'expo-crypto';

import { getDb } from '@/api/db/client';
import type { Book, NewBookInput, ReadingStatus } from '@/types/book';

import type { BookDetailsUpdate, BookRepository, ImportBooksResult } from './types';

interface BookRow {
  id: string;
  google_books_id: string | null;
  title: string;
  subtitle: string | null;
  authors: string;
  genres: string;
  manual_genres: string;
  thumbnail_url: string | null;
  description: string | null;
  published_date: string | null;
  page_count: number | null;
  publisher: string | null;
  language: string | null;
  notes: string | null;
  status: ReadingStatus;
  created_at: string;
  updated_at: string;
}

function rowToBook(row: BookRow): Book {
  return {
    id: row.id,
    googleBooksId: row.google_books_id,
    title: row.title,
    subtitle: row.subtitle,
    authors: JSON.parse(row.authors) as string[],
    genres: JSON.parse(row.genres) as string[],
    manualGenres: JSON.parse(row.manual_genres) as string[],
    thumbnailUrl: row.thumbnail_url,
    description: row.description,
    publishedDate: row.published_date,
    pageCount: row.page_count,
    publisher: row.publisher,
    language: row.language,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getById(id: string): Promise<Book | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<BookRow>('SELECT * FROM books WHERE id = ?', [id]);
  return row ? rowToBook(row) : null;
}

export const sqliteBookRepository: BookRepository = {
  async getAll() {
    const db = await getDb();
    const rows = await db.getAllAsync<BookRow>('SELECT * FROM books ORDER BY title COLLATE NOCASE');
    return rows.map(rowToBook);
  },

  getById,

  async add(input: NewBookInput) {
    const db = await getDb();
    const id = randomUUID();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO books (
        id, google_books_id, title, subtitle, authors, genres, manual_genres, thumbnail_url,
        description, published_date, page_count, publisher, language, notes,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'to_read', ?, ?)`,
      [
        id,
        input.googleBooksId,
        input.title,
        input.subtitle,
        JSON.stringify(input.authors),
        JSON.stringify(input.genres),
        JSON.stringify(input.manualGenres),
        input.thumbnailUrl,
        input.description,
        input.publishedDate,
        input.pageCount,
        input.publisher,
        input.language,
        input.notes,
        now,
        now,
      ],
    );

    const created = await getById(id);
    if (!created) throw new Error('Failed to read back newly inserted book');
    return created;
  },

  async updateGenres(id: string, genres: string[], manualGenres: string[]) {
    const db = await getDb();
    const now = new Date().toISOString();
    await db.runAsync('UPDATE books SET genres = ?, manual_genres = ?, updated_at = ? WHERE id = ?', [
      JSON.stringify(genres),
      JSON.stringify(manualGenres),
      now,
      id,
    ]);

    const updated = await getById(id);
    if (!updated) throw new Error(`Book not found: ${id}`);
    return updated;
  },

  async updateDetails(id: string, updates: BookDetailsUpdate) {
    const db = await getDb();
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE books SET
        title = ?, authors = ?, description = ?, thumbnail_url = ?,
        published_date = ?, page_count = ?, publisher = ?, language = ?, notes = ?, updated_at = ?
      WHERE id = ?`,
      [
        updates.title,
        JSON.stringify(updates.authors),
        updates.description,
        updates.thumbnailUrl,
        updates.publishedDate,
        updates.pageCount,
        updates.publisher,
        updates.language,
        updates.notes,
        now,
        id,
      ],
    );

    const updated = await getById(id);
    if (!updated) throw new Error(`Book not found: ${id}`);
    return updated;
  },

  async updateNotes(id: string, notes: string | null) {
    const db = await getDb();
    const now = new Date().toISOString();
    await db.runAsync('UPDATE books SET notes = ?, updated_at = ? WHERE id = ?', [notes, now, id]);

    const updated = await getById(id);
    if (!updated) throw new Error(`Book not found: ${id}`);
    return updated;
  },

  async remove(id: string) {
    const db = await getDb();
    await db.runAsync('DELETE FROM books WHERE id = ?', [id]);
  },

  async importBooks(books: Book[]): Promise<ImportBooksResult> {
    const db = await getDb();
    let imported = 0;
    let skipped = 0;

    await db.withTransactionAsync(async () => {
      for (const book of books) {
        // INSERT OR IGNORE relies on the existing PRIMARY KEY (id) and
        // UNIQUE (google_books_id) constraints to silently skip anything
        // that already exists — no separate existence check needed.
        const result = await db.runAsync(
          `INSERT OR IGNORE INTO books (
            id, google_books_id, title, subtitle, authors, genres, manual_genres, thumbnail_url,
            description, published_date, page_count, publisher, language, notes,
            status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            book.id,
            book.googleBooksId,
            book.title,
            // Older backups predate these fields — default to null rather
            // than passing undefined to the SQLite bind params.
            book.subtitle ?? null,
            JSON.stringify(book.authors),
            JSON.stringify(book.genres),
            JSON.stringify(book.manualGenres ?? []),
            book.thumbnailUrl,
            book.description,
            book.publishedDate,
            book.pageCount,
            book.publisher ?? null,
            book.language ?? null,
            book.notes ?? null,
            book.status,
            book.createdAt,
            book.updatedAt,
          ],
        );

        if (result.changes > 0) {
          imported++;
        } else {
          skipped++;
        }
      }
    });

    return { imported, skipped };
  },
};
