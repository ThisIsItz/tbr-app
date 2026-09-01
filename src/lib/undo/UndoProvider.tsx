import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

import type { Book } from '@/types/book';

const DISMISS_AFTER_MS = 5000;

interface UndoContextValue {
  deletedBook: Book | null;
  notifyDeleted: (book: Book) => void;
  dismiss: () => void;
}

const UndoContext = createContext<UndoContextValue | null>(null);

export function UndoProvider({ children }: { children: ReactNode }) {
  const [deletedBook, setDeletedBook] = useState<Book | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setDeletedBook(null);
  }, []);

  const notifyDeleted = useCallback((book: Book) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setDeletedBook(book);
    timerRef.current = setTimeout(() => setDeletedBook(null), DISMISS_AFTER_MS);
  }, []);

  return (
    <UndoContext.Provider value={{ deletedBook, notifyDeleted, dismiss }}>{children}</UndoContext.Provider>
  );
}

export function useUndoContext() {
  const context = useContext(UndoContext);
  if (!context) throw new Error('useUndoContext must be used within UndoProvider');
  return context;
}
