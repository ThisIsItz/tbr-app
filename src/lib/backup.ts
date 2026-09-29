import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { saveFileAsync } from '../../modules/save-file';
import { bookRepository } from '@/api/repository';
import type { ImportBooksResult } from '@/api/repository/types';
import { READING_STATUSES, type Book, type ReadingStatus } from '@/types/book';

const BACKUP_VERSION = 1;

interface BackupPayload {
  version: number;
  exportedAt: string;
  books: Book[];
}

export class BackupFileError extends Error {
  constructor() {
    super('File is not a valid TBR backup');
    this.name = 'BackupFileError';
  }
}

function isReadingStatus(value: unknown): value is ReadingStatus {
  return READING_STATUSES.includes(value as ReadingStatus);
}

function isValidBook(value: unknown): value is Book {
  if (!value || typeof value !== 'object') return false;
  const b = value as Record<string, unknown>;
  return (
    typeof b.id === 'string' &&
    typeof b.title === 'string' &&
    Array.isArray(b.authors) &&
    Array.isArray(b.genres) &&
    isReadingStatus(b.status) &&
    typeof b.createdAt === 'string' &&
    typeof b.updatedAt === 'string'
  );
}

export async function exportAndShareBackup(): Promise<void> {
  const books = await bookRepository.getAll();
  const payload: BackupPayload = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    books,
  };
  const contents = JSON.stringify(payload, null, 2);
  const filename = `tbr-backup-${Date.now()}.json`;

  if (Platform.OS === 'android') {
    await saveFileAsync(filename, 'application/json', contents);
    return;
  }

  const file = new File(Paths.cache, filename);
  file.create();
  file.write(contents);

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device');
  }
  await Sharing.shareAsync(file.uri);
}

function parseBackup(jsonText: string): { books: Book[]; invalidCount: number } {
  let data: unknown;
  try {
    data = JSON.parse(jsonText);
  } catch {
    throw new BackupFileError();
  }

  if (!data || typeof data !== 'object' || !Array.isArray((data as { books?: unknown }).books)) {
    throw new BackupFileError();
  }

  const rawBooks = (data as { books: unknown[] }).books;
  const books = rawBooks.filter(isValidBook);
  return { books, invalidCount: rawBooks.length - books.length };
}

export async function importBackupFromUri(
  fileUri: string,
): Promise<ImportBooksResult & { invalid: number }> {
  const file = new File(fileUri);
  const text = await file.text();
  const { books, invalidCount } = parseBackup(text);
  const { imported, skipped } = await bookRepository.importBooks(books);
  return { imported, skipped, invalid: invalidCount };
}
