import { Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { useRestoreBook } from '@/hooks/useLibrary';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTranslation } from '@/hooks/useTranslation';
import { capitalizeFirst } from '@/lib/capitalize';
import { Typography } from '@/lib/theme/theme';
import { useUndoContext } from '@/lib/undo/UndoProvider';

export function UndoToast() {
  const { deletedBook, dismiss } = useUndoContext();
  const restoreBook = useRestoreBook();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const toastBackground = useThemeColor({}, 'text');
  const toastText = useThemeColor({}, 'background');
  const shadowColor = useThemeColor({}, 'shadow');

  if (!deletedBook) return null;

  function handleUndo() {
    if (!deletedBook) return;
    restoreBook.mutate(deletedBook);
    dismiss();
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(200)}
      exiting={FadeOutDown.duration(200)}
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: insets.bottom + 16 }]}>
      <Animated.View style={[styles.toast, { backgroundColor: toastBackground, shadowColor }]}>
        <ThemedText numberOfLines={1} style={[Typography.body, styles.message, { color: toastText }]}>
          {t('bookDetail.removedToast', { title: capitalizeFirst(deletedBook.title) })}
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    width: '100%',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 6,
  },
  message: {
    flex: 1,
  },
  undoText: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
