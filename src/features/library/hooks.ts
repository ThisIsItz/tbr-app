import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { exportAndShareBackup, importBackupFromUri } from '@/lib/backup';
import { bookRepository } from '@/data/repository';
import type { BookDetailsUpdate } from '@/data/repository/types';
import type { NewBookInput } from '@/types/book';

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

export function useBookExistsByGoogleId(googleBooksId: string | undefined) {
  return useQuery({
    queryKey: [...booksQueryKey, 'exists', googleBooksId],
    queryFn: () => bookRepository.existsByGoogleBooksId(googleBooksId as string),
    enabled: !!googleBooksId,
  });
}

export function useAddBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewBookInput) => bookRepository.add(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: booksQueryKey });
    },
  });
}

export function useUpdateBookGenres() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, genres }: { id: string; genres: string[] }) =>
      bookRepository.updateGenres(id, genres),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: booksQueryKey });
    },
  });
}

export function useUpdateBookDetails() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: BookDetailsUpdate }) =>
      bookRepository.updateDetails(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: booksQueryKey });
    },
  });
}

export function useDeleteBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bookRepository.remove(id),
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
