import type { Book, NewBookInput, ReadingStatus } from '@/types/book';

export interface BookRepository {
  getAll(): Promise<Book[]>;
  getById(id: string): Promise<Book | null>;
  existsByGoogleBooksId(googleBooksId: string): Promise<boolean>;
  add(input: NewBookInput): Promise<Book>;
  updateStatus(id: string, status: ReadingStatus): Promise<Book>;
  updateGenres(id: string, genres: string[]): Promise<Book>;
  remove(id: string): Promise<void>;
}
