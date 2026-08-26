import { sqliteBookRepository } from './sqliteBookRepository';
import type { BookRepository } from './types';

export const bookRepository: BookRepository = sqliteBookRepository;
export type { BookRepository } from './types';
