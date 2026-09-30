import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { useRestoreBook } from '@/hooks/useLibrary';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTranslation } from '@/hooks/useTranslation';
import { capitalizeFirst } from '@/lib/capitalize';
import { Typography } from '@/lib/theme/theme';
import { useUndoContext } from '@/lib/undo/UndoProvider';
import type { Book } from '@/types/book';

const DISMISS_AFTER_MS = 5000;

function UndoToastItem({ book, onDismiss }: { book: Book; onDismiss: () => void }) {
  const restoreBook = useRestoreBook();
  const { t } = useTranslation();
  const toastBackground = useThemeColor({}, 'text');
  const toastText = useThemeColor({}, 'background');
  const shadowColor = useThemeColor({}, 'shadow');

  useEffect(() => {
    const timeoutId = setTimeout(onDismiss, DISMISS_AFTER_MS);
    return () => clearTimeout(timeoutId);
  }, [onDismiss]);

  function handleUndo() {
    restoreBook.mutate(book);
    onDismiss();
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(200)}
      exiting={FadeOutDown.duration(200)}
      style={[styles.toast, { backgroundColor: toastBackground, boxShadow: `0px 4px 10px ${shadowColor}` }]}>
      <ThemedText numberOfLines={1} style={[Typography.body, styles.message, { color: toastText }]}>
        {t('bookDetail.removedToast', { title: capitalizeFirst(book.title) })}
      </ThemedText>
      <Pressable
        onPress={handleUndo}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t('common.undo')}>
        <ThemedText style={[Typography.button, styles.undoText, { color: toastText }]}>
          {t('common.undo')}
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
}

export function UndoToast() {
  const { deletedBooks, dismiss } = useUndoContext();
  const insets = useSafeAreaInsets();

  if (deletedBooks.length === 0) return null;

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { bottom: insets.bottom + 16 }]}>
      {deletedBooks.map((book) => (
        <UndoToastItem key={book.id} book={book} onDismiss={() => dismiss(book.id)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    gap: 8,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    width: '100%',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  message: {
    flex: 1,
  },
  undoText: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
