import { Image, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Typography } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslation } from '@/hooks/use-translation';
import { toHttpsUrl } from '@/lib/google-books';

interface BookCardAction {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

interface BookCardProps {
  title: string;
  author?: string | null;
  genre?: string | null;
  statusLabel?: string | null;
  thumbnailUrl?: string | null;
  onPress?: () => void;
  action?: BookCardAction;
  /** 'library' (default): saved-book row with genre/status chips.
   *  'result': compact search-result row — plain-text genre, "Unknown
   *  author" fallback, and a small bottom-right action button instead of
   *  a full-width one. */
  variant?: 'library' | 'result';
}

export function BookCard({
  title,
  author,
  genre,
  statusLabel,
  thumbnailUrl,
  onPress,
  action,
  variant = 'library',
}: BookCardProps) {
  const { t } = useTranslation();
  const surfaceColor = useThemeColor({}, 'surface');
  const surfaceMutedColor = useThemeColor({}, 'surfaceMuted');
  const shadowColor = useThemeColor({}, 'shadow');
  const textColor = useThemeColor({}, 'text');
  const textMutedColor = useThemeColor({}, 'textMuted');
  const accentColor = useThemeColor({}, 'accent');
  const accentSoftColor = useThemeColor({}, 'accentSoft');

  const coverUrl = toHttpsUrl(thumbnailUrl);
  const isResult = variant === 'result';

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: surfaceColor, shadowColor }]}>
      {coverUrl ? (
        <Image
          source={{ uri: coverUrl }}
          style={styles.cover}
          resizeMode="cover"
          onError={(e) => console.warn('[BookCard] cover failed to load:', coverUrl, e.nativeEvent.error)}
        />
      ) : (
        <View style={[styles.cover, styles.coverPlaceholder, { backgroundColor: surfaceMutedColor }]}>
          <ThemedText style={[Typography.caption, { color: textMutedColor }]}>
            {t('bookCard.noCover')}
          </ThemedText>
        </View>
      )}

      <View style={styles.body}>
        <ThemedText numberOfLines={2} style={[Typography.bookTitle, { color: textColor }]}>
          {title}
        </ThemedText>

        {isResult ? (
          <>
            <ThemedText numberOfLines={1} style={[Typography.metadata, { color: textMutedColor }]}>
              {author || t('bookCard.unknownAuthor')}
            </ThemedText>
            {!!genre && (
              <ThemedText numberOfLines={1} style={[Typography.caption, { color: textMutedColor }]}>
                {genre}
              </ThemedText>
            )}
            {action && (
              <Pressable
                onPress={action.onPress}
                disabled={action.disabled}
                style={[
                  styles.compactActionButton,
                  { backgroundColor: action.disabled ? surfaceMutedColor : accentColor },
                ]}>
                <ThemedText
                  style={[Typography.button, { color: action.disabled ? textMutedColor : '#fff' }]}>
                  {action.label}
                </ThemedText>
              </Pressable>
            )}
          </>
        ) : (
          <>
            {!!author && (
              <ThemedText numberOfLines={1} style={[Typography.metadata, { color: textMutedColor }]}>
                {author}
              </ThemedText>
            )}
            <View style={styles.tagRow}>
              {!!genre && (
                <View style={[styles.tag, { backgroundColor: accentSoftColor }]}>
                  <ThemedText numberOfLines={1} style={[Typography.caption, { color: accentColor }]}>
                    {genre}
                  </ThemedText>
                </View>
              )}
              {!!statusLabel && (
                <View style={[styles.tag, { backgroundColor: surfaceMutedColor }]}>
                  <ThemedText numberOfLines={1} style={[Typography.caption, { color: textMutedColor }]}>
                    {statusLabel}
                  </ThemedText>
                </View>
              )}
            </View>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 10,
    gap: 12,
    width: '100%',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  cover: {
    width: 60,
    height: 90,
    borderRadius: 8,
  },
  coverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    justifyContent: 'center',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  tag: {
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
    maxWidth: '100%',
  },
  compactActionButton: {
    alignSelf: 'flex-end',
    marginTop: 6,
    borderRadius: 8,
    paddingHorizontal: 14,
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
