import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import type { Book } from '@/types/book';

const DISMISS_AFTER_MS = 5000;

interface UndoContextValue {
  deletedBook: Book | null;
  notifyDeleted: (book: Book) => void;
  dismiss: () => void;
}

const UndoContext = createContext<UndoContextValue | null>(null);

export function UndoProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<Book[]>([]);

  const advance = useCallback(() => {
    setQueue((q) => q.slice(1));
  }, []);

  const notifyDeleted = useCallback((book: Book) => {
    setQueue((q) => [...q, book]);
  }, []);

  useEffect(() => {
    if (queue.length === 0) return;
    const timeoutId = setTimeout(advance, DISMISS_AFTER_MS);
    return () => clearTimeout(timeoutId);
  }, [queue, advance]);

  return (
    <UndoContext.Provider value={{ deletedBook: queue[0] ?? null, notifyDeleted, dismiss: advance }}>
      {children}
    </UndoContext.Provider>
  );
}

export function useUndoContext() {
  const context = useContext(UndoContext);
  if (!context) throw new Error('useUndoContext must be used within UndoProvider');
  return context;
}
