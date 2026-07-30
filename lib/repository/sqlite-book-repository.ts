import { randomUUID } from 'expo-crypto';

import { getDb } from '@/lib/db/client';
import type { Book, NewBookInput, ReadingStatus } from '@/types/book';

import type { BookRepository } from './types';

interface BookRow {
  id: string;
  google_books_id: string | null;
  title: string;
  authors: string;
  genres: string;
  thumbnail_url: string | null;
  description: string | null;
  published_date: string | null;
  page_count: number | null;
  status: ReadingStatus;
  created_at: string;
  updated_at: string;
}

function rowToBook(row: BookRow): Book {
  return {
    id: row.id,
    googleBooksId: row.google_books_id,
    title: row.title,
    authors: JSON.parse(row.authors) as string[],
    genres: JSON.parse(row.genres) as string[],
    thumbnailUrl: row.thumbnail_url,
    description: row.description,
    publishedDate: row.published_date,
    pageCount: row.page_count,
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

  async existsByGoogleBooksId(googleBooksId: string) {
    const db = await getDb();
    const row = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM books WHERE google_books_id = ?',
      [googleBooksId],
    );
    return row !== null;
  },

  async add(input: NewBookInput) {
    const db = await getDb();
    const id = randomUUID();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO books (
        id, google_books_id, title, authors, genres, thumbnail_url,
        description, published_date, page_count, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'to_read', ?, ?)`,
      [
        id,
        input.googleBooksId,
        input.title,
        JSON.stringify(input.authors),
        JSON.stringify(input.genres),
        input.thumbnailUrl,
        input.description,
        input.publishedDate,
        input.pageCount,
        now,
        now,
      ],
    );

    const created = await getById(id);
    if (!created) throw new Error('Failed to read back newly inserted book');
    return created;
  },

  async updateStatus(id: string, status: ReadingStatus) {
    const db = await getDb();
    const now = new Date().toISOString();
    await db.runAsync('UPDATE books SET status = ?, updated_at = ? WHERE id = ?', [status, now, id]);

    const updated = await getById(id);
    if (!updated) throw new Error(`Book not found: ${id}`);
    return updated;
  },

  async updateGenres(id: string, genres: string[]) {
    const db = await getDb();
    const now = new Date().toISOString();
    await db.runAsync('UPDATE books SET genres = ?, updated_at = ? WHERE id = ?', [
      JSON.stringify(genres),
      now,
      id,
    ]);

    const updated = await getById(id);
    if (!updated) throw new Error(`Book not found: ${id}`);
    return updated;
  },

  async remove(id: string) {
    const db = await getDb();
    await db.runAsync('DELETE FROM books WHERE id = ?', [id]);
  },
};
