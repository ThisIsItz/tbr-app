export type ReadingStatus = 'to_read' | 'reading' | 'read' | 'dnf';

export const READING_STATUSES: ReadingStatus[] = ['to_read', 'reading', 'read', 'dnf'];

export interface Book {
  id: string;
  googleBooksId: string | null;
  title: string;
  subtitle: string | null;
  authors: string[];
  genres: string[];
  manualGenres: string[];
  thumbnailUrl: string | null;
  description: string | null;
  publishedDate: string | null;
  pageCount: number | null;
  publisher: string | null;
  language: string | null;
  isbn13: string | null;
  isbn10: string | null;
  notes: string | null;
  status: ReadingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface NewBookInput {
  googleBooksId: string | null;
  title: string;
  subtitle: string | null;
  authors: string[];
  genres: string[];
  manualGenres: string[];
  thumbnailUrl: string | null;
  description: string | null;
  publishedDate: string | null;
  pageCount: number | null;
  publisher: string | null;
  language: string | null;
  isbn13?: string | null;
  isbn10?: string | null;
  notes: string | null;
}
