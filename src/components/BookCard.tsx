import { Image } from 'expo-image';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/IconSymbol';
import { Typography } from '@/lib/theme/theme';
import { capitalizeFirst } from '@/lib/capitalize';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTranslation } from '@/hooks/useTranslation';
import { toHttpsUrl } from '@/api/googleBooks';

interface BookCardAction {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

interface BookCardProps {
  title: string;
  author?: string | null;
  genres?: string[];
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
  genres = [],
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
  const onAccentColor = useThemeColor({}, 'onAccent');
  const onAccentSoftColor = useThemeColor({}, 'onAccentSoft');
  const accentSoftColor = useThemeColor({}, 'accentSoft');

  const coverUrl = toHttpsUrl(thumbnailUrl);
  const isResult = variant === 'result';
  const displayTitle = capitalizeFirst(title);
  const displayAuthor = author ? capitalizeFirst(author) : author;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={displayAuthor ? `${displayTitle}, ${displayAuthor}` : displayTitle}
      style={[
        styles.card,
        { backgroundColor: surfaceColor, shadowColor },
        Platform.OS === 'web' && { boxShadow: `0px 3px 12px ${shadowColor}` },
      ]}>
      {coverUrl ? (
        <Image
          source={{ uri: coverUrl }}
          style={[styles.cover, isResult ? styles.coverResult : styles.coverLibrary]}
          contentFit="cover"
          onError={(e) => console.warn('[BookCard] cover failed to load:', coverUrl, e.error)}
        />
      ) : (
        <View
          style={[
            styles.cover,
            isResult ? styles.coverResult : styles.coverLibrary,
            styles.coverPlaceholder,
            { backgroundColor: surfaceMutedColor },
          ]}>
          <ThemedText style={[Typography.caption, { color: textMutedColor }]}>
            {t('bookCard.noCover')}
          </ThemedText>
        </View>
      )}

      <View style={styles.body}>
        {isResult ? (
          <>
            <View style={styles.resultTop}>
              <ThemedText numberOfLines={2} style={[Typography.bookTitle, { color: textColor }]}>
                {displayTitle}
              </ThemedText>
              <ThemedText numberOfLines={1} style={[Typography.metadata, { color: textMutedColor }]}>
                {displayAuthor || t('bookCard.unknownAuthor')}
              </ThemedText>
            </View>
            {!!genres[0] && (
              <View style={styles.resultFooterRow}>
                <View style={[styles.tag, { backgroundColor: accentSoftColor }]}>
                  <ThemedText numberOfLines={1} style={[Typography.caption, { color: onAccentSoftColor }]}>
                    {genres[0]}
                  </ThemedText>
                </View>
              </View>
            )}
          </>
        ) : (
          <>
            <ThemedText numberOfLines={3} style={[Typography.bookTitle, { color: textColor }]}>
              {displayTitle}
            </ThemedText>
            <View style={styles.libraryFooter}>
              {!!displayAuthor && (
                <ThemedText numberOfLines={1} style={[Typography.metadata, { color: textMutedColor }]}>
                  {displayAuthor}
                </ThemedText>
              )}
              <View style={styles.tagRow}>
                {genres.slice(0, 2).map((genre) => (
                  <View key={genre} style={[styles.tag, { backgroundColor: accentSoftColor }]}>
                    <ThemedText numberOfLines={1} style={[Typography.caption, { color: onAccentSoftColor }]}>
                      {genre}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
      </View>

      {isResult ? (
        <>
          {action && (
            <View style={styles.resultActions}>
              <Pressable
                onPress={action.onPress}
                disabled={action.disabled}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={action.label}
                style={[
                  styles.compactActionButton,
                  action.disabled
                    ? styles.compactActionButtonDisabled
                    : { backgroundColor: accentColor },
                ]}>
                {action.disabled && <IconSymbol name="checkmark" size={14} color={accentColor} />}
                <ThemedText
                  style={[
                    Typography.caption,
                    styles.compactActionText,
                    { color: action.disabled ? accentColor : onAccentColor },
                  ]}>
                  {action.label}
                </ThemedText>
              </Pressable>
            </View>
          )}
        </>
      ) : (
        <View style={[styles.chevronCircle, styles.chevronCircleLibrary, { backgroundColor: accentSoftColor }]}>
          <IconSymbol name="chevron.right" size={22} color={onAccentSoftColor} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    flexDirection: 'row',
    borderRadius: 14,
    padding: 10,
    gap: 12,
    width: '100%',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
  cover: {
    borderRadius: 8,
  },
  coverResult: {
    width: 60,
    height: 90,
  },
  coverLibrary: {
    width: 90,
    height: 135,
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
    justifyContent: 'space-between',
  },
  resultTop: {
    gap: 2,
  },
  libraryFooter: {
    gap: 4,
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
  resultFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  resultActions: {
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  compactActionButton: {
    flexDirection: 'row',
    borderRadius: 10,
    minHeight: 34,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  compactActionButtonDisabled: {
    backgroundColor: 'transparent',
    minHeight: 'auto',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  compactActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  chevronCircle: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronCircleLibrary: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});
