import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';

import { exportAndShareBackup, importBackupFromUri } from '@/lib/backup';
import { bookRepository } from '@/api/repository';
import type { BookDetailsUpdate } from '@/api/repository/types';
import type { Book, NewBookInput } from '@/types/book';

export const booksQueryKey = ['books'] as const;

export function useBooks() {
  return useQuery({
    queryKey: booksQueryKey,
    queryFn: () => bookRepository.getAll(),
  });
}

export function useBook(id: string | undefined) {
  return useQuery({
    queryKey: [...booksQueryKey, id],
    queryFn: () => bookRepository.getById(id as string),
    enabled: !!id,
  });
}

export function useAddBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewBookInput) => bookRepository.add(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: booksQueryKey });

      const previousBooks = queryClient.getQueryData<Book[]>(booksQueryKey);
      const now = new Date().toISOString();
      const optimisticBook: Book = { ...input, id: randomUUID(), status: 'to_read', createdAt: now, updatedAt: now };

      queryClient.setQueryData<Book[]>(booksQueryKey, (books) =>
        books ? [optimisticBook, ...books] : [optimisticBook],
      );

      return { previousBooks };
    },
    onError: (_error, _input, context) => {
      if (context?.previousBooks) queryClient.setQueryData(booksQueryKey, context.previousBooks);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: booksQueryKey });
    },
  });
}

export function useUpdateBookGenres() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, genres, manualGenres }: { id: string; genres: string[]; manualGenres: string[] }) =>
      bookRepository.updateGenres(id, genres, manualGenres),
    onMutate: async ({ id, genres, manualGenres }) => {
      await queryClient.cancelQueries({ queryKey: booksQueryKey });

      const previousBooks = queryClient.getQueryData<Book[]>(booksQueryKey);
      const previousBook = queryClient.getQueryData<Book>([...booksQueryKey, id]);

      queryClient.setQueryData<Book[]>(booksQueryKey, (books) =>
        books?.map((book) => (book.id === id ? { ...book, genres, manualGenres } : book)),
      );
      queryClient.setQueryData<Book>([...booksQueryKey, id], (book) =>
        book ? { ...book, genres, manualGenres } : book,
      );

      return { previousBooks, previousBook };
    },
    onError: (_error, { id }, context) => {
      if (context?.previousBooks) queryClient.setQueryData(booksQueryKey, context.previousBooks);
      if (context?.previousBook) queryClient.setQueryData([...booksQueryKey, id], context.previousBook);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: booksQueryKey });
    },
  });
}

export function useUpdateBookDetails() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: BookDetailsUpdate }) =>
      bookRepository.updateDetails(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: booksQueryKey });

      const previousBooks = queryClient.getQueryData<Book[]>(booksQueryKey);
      const previousBook = queryClient.getQueryData<Book>([...booksQueryKey, id]);

      queryClient.setQueryData<Book[]>(booksQueryKey, (books) =>
        books?.map((book) => (book.id === id ? { ...book, ...updates } : book)),
      );
      queryClient.setQueryData<Book>([...booksQueryKey, id], (book) => (book ? { ...book, ...updates } : book));

      return { previousBooks, previousBook };
    },
    onError: (_error, { id }, context) => {
      if (context?.previousBooks) queryClient.setQueryData(booksQueryKey, context.previousBooks);
      if (context?.previousBook) queryClient.setQueryData([...booksQueryKey, id], context.previousBook);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: booksQueryKey });
    },
  });
}

export function useUpdateBookNotes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string | null }) =>
      bookRepository.updateNotes(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: booksQueryKey });
    },
  });
}

export function useDeleteBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bookRepository.remove(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: booksQueryKey });

      const previousBooks = queryClient.getQueryData<Book[]>(booksQueryKey);
      queryClient.setQueryData<Book[]>(booksQueryKey, (books) => books?.filter((book) => book.id !== id));

      return { previousBooks };
    },
    onError: (_error, _id, context) => {
      if (context?.previousBooks) queryClient.setQueryData(booksQueryKey, context.previousBooks);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: booksQueryKey });
    },
  });
}

export function useRestoreBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (book: Book) => bookRepository.importBooks([book]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: booksQueryKey });
    },
  });
}

export function useExportBackup() {
  return useMutation({
    mutationFn: () => exportAndShareBackup(),
  });
}

export function useImportBackup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fileUri: string) => importBackupFromUri(fileUri),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: booksQueryKey });
    },
  });
}
