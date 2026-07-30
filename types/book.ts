export type ReadingStatus = 'to_read' | 'reading' | 'read' | 'dnf';

export const READING_STATUSES: ReadingStatus[] = ['to_read', 'reading', 'read', 'dnf'];

export const READING_STATUS_LABELS: Record<ReadingStatus, string> = {
  to_read: 'To Read',
  reading: 'Reading',
  read: 'Read',
  dnf: 'Did Not Finish',
};

export interface Book {
  id: string;
  googleBooksId: string | null;
  title: string;
  authors: string[];
  genres: string[];
  thumbnailUrl: string | null;
  description: string | null;
  publishedDate: string | null;
  pageCount: number | null;
  status: ReadingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface NewBookInput {
  googleBooksId: string | null;
  title: string;
  authors: string[];
  genres: string[];
  thumbnailUrl: string | null;
  description: string | null;
  publishedDate: string | null;
  pageCount: number | null;
}
