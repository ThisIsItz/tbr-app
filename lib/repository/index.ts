import { sqliteBookRepository } from './sqlite-book-repository';
import type { BookRepository } from './types';

export const bookRepository: BookRepository = sqliteBookRepository;
export type { BookRepository } from './types';
