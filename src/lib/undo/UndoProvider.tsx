import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

import type { Book } from '@/types/book';

interface UndoContextValue {
  deletedBooks: Book[];
  notifyDeleted: (book: Book) => void;
  dismiss: (bookId: string) => void;
}

const UndoContext = createContext<UndoContextValue | null>(null);

export function UndoProvider({ children }: { children: ReactNode }) {
  const [deletedBooks, setDeletedBooks] = useState<Book[]>([]);

  const notifyDeleted = useCallback((book: Book) => {
    setDeletedBooks((books) => [...books, book]);
  }, []);

  const dismiss = useCallback((bookId: string) => {
    setDeletedBooks((books) => books.filter((book) => book.id !== bookId));
  }, []);

  return (
    <UndoContext.Provider value={{ deletedBooks, notifyDeleted, dismiss }}>{children}</UndoContext.Provider>
  );
}

export function useUndoContext() {
  const context = useContext(UndoContext);
  if (!context) throw new Error('useUndoContext must be used within UndoProvider');
  return context;
}
