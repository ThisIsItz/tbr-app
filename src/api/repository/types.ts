import type { Book, NewBookInput } from '@/types/book';

export interface ImportBooksResult {
  imported: number;
  skipped: number;
}

export interface BookDetailsUpdate {
  title: string;
  authors: string[];
  description: string | null;
  thumbnailUrl: string | null;
  publishedDate: string | null;
  pageCount: number | null;
  publisher: string | null;
  language: string | null;
  isbn13: string | null;
  isbn10: string | null;
  notes: string | null;
}

export interface BookRepository {
  getAll(): Promise<Book[]>;
  getById(id: string): Promise<Book | null>;
  add(input: NewBookInput): Promise<Book>;
  updateGenres(id: string, genres: string[], manualGenres: string[]): Promise<Book>;
  /** Title/author/description/cover/etc — only meant to be called for
   * manually-added books (googleBooksId === null); Google-sourced data
   * stays read-only aside from genres. */
  updateDetails(id: string, updates: BookDetailsUpdate): Promise<Book>;
  updateNotes(id: string, notes: string | null): Promise<Book>;
  updateIsbn(id: string, isbn13: string | null, isbn10: string | null): Promise<Book>;
  remove(id: string): Promise<void>;
  /** Bulk-inserts previously-exported books, preserving their original id/timestamps.
   * Any book whose id or googleBooksId already exists locally is left untouched. */
  importBooks(books: Book[]): Promise<ImportBooksResult>;
}
