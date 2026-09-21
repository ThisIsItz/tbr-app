import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { CoverImage } from '@/components/CoverImage';
import { IconSymbol } from '@/components/IconSymbol';
import { Typography } from '@/lib/theme/theme';
import { capitalizeFirst } from '@/lib/capitalize';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTranslation } from '@/hooks/useTranslation';
import { toHighResUrl, toHttpsUrl } from '@/api/googleBooks';

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
   *  a full-width one.
   *  'list': flat single-line row (small cover, title + author, no
   *  genres) for the library's compact list view.
   *  'grid': 2-column shelf tile — large cover, title only, no author/genres. */
  variant?: 'library' | 'result' | 'list' | 'grid';
}

export const BookCard = memo(function BookCard({
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

  const coverUrl = toHighResUrl(thumbnailUrl);
  const fallbackCoverUrl = toHttpsUrl(thumbnailUrl);
  const isResult = variant === 'result';
  const isList = variant === 'list';
  const isGrid = variant === 'grid';
  const displayTitle = capitalizeFirst(title);
  const displayAuthor = author ? capitalizeFirst(author) : author;

  if (isGrid) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={displayTitle} style={styles.gridTile}>
        {coverUrl ? (
          <View style={[styles.coverGrid, { boxShadow: `0px 3px 6px ${shadowColor}` }]}>
            <View style={styles.coverGridClip}>
              <CoverImage uri={coverUrl} fallbackUri={fallbackCoverUrl} style={styles.coverGridImage} />
            </View>
          </View>
        ) : (
          <View
            style={[
              styles.coverGrid,
              styles.coverPlaceholder,
              { backgroundColor: surfaceMutedColor, boxShadow: `0px 3px 6px ${shadowColor}` },
            ]}>
            <ThemedText style={[Typography.caption, styles.gridPlaceholderText, { color: textMutedColor }]}>
              {t('bookCard.noCover')}
            </ThemedText>
          </View>
        )}
        <ThemedText numberOfLines={2} style={[Typography.metadata, styles.gridTitle, { color: textColor }]}>
          {displayTitle}
        </ThemedText>
      </Pressable>
    );
  }

  if (isList) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={displayAuthor ? `${displayTitle}, ${displayAuthor}` : displayTitle}
        style={[styles.listRow, { borderBottomColor: surfaceMutedColor }]}>
        {coverUrl ? (
          <CoverImage uri={coverUrl} fallbackUri={fallbackCoverUrl} style={styles.coverList} />
        ) : (
          <View style={[styles.coverList, styles.coverPlaceholder, { backgroundColor: surfaceMutedColor }]} />
        )}
        <View style={styles.listBody}>
          <ThemedText numberOfLines={1} style={[Typography.body, styles.listTitle, { color: textColor }]}>
            {displayTitle}
          </ThemedText>
          {!!displayAuthor && (
            <ThemedText numberOfLines={1} style={[Typography.caption, { color: textMutedColor }]}>
              {displayAuthor}
            </ThemedText>
          )}
        </View>
        <IconSymbol name="chevron.right" size={18} color={textMutedColor} />
      </Pressable>
    );
  }

  if (isResult) {
    return (
      <View
        style={[
          styles.card,
          { backgroundColor: surfaceColor, boxShadow: `0px 4px 10px ${shadowColor}` },
        ]}>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={displayAuthor ? `${displayTitle}, ${displayAuthor}` : displayTitle}
          style={styles.resultPressArea}>
          {coverUrl ? (
            <CoverImage uri={coverUrl} fallbackUri={fallbackCoverUrl} style={[styles.cover, styles.coverResult]} />
          ) : (
            <View
              style={[
                styles.cover,
                styles.coverResult,
                styles.coverPlaceholder,
                { backgroundColor: surfaceMutedColor },
              ]}>
              <ThemedText style={[Typography.caption, { color: textMutedColor }]}>
                {t('bookCard.noCover')}
              </ThemedText>
            </View>
          )}

          <View style={styles.body}>
            <View style={styles.resultTop}>
              <ThemedText numberOfLines={2} style={[Typography.bookTitle, { color: textColor }]}>
                {displayTitle}
              </ThemedText>
              <ThemedText numberOfLines={1} style={[Typography.metadata, { color: textMutedColor }]}>
                {displayAuthor || t('bookCard.unknownAuthor')}
              </ThemedText>
            </View>
          </View>
        </Pressable>

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
                action.disabled ? styles.compactActionButtonDisabled : { backgroundColor: accentColor },
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
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={displayAuthor ? `${displayTitle}, ${displayAuthor}` : displayTitle}
      style={[
        styles.card,
        { backgroundColor: surfaceColor, boxShadow: `0px 4px 10px ${shadowColor}` },
      ]}>
      {coverUrl ? (
        <CoverImage uri={coverUrl} fallbackUri={fallbackCoverUrl} style={[styles.cover, styles.coverLibrary]} />
      ) : (
        <View
          style={[
            styles.cover,
            styles.coverLibrary,
            styles.coverPlaceholder,
            { backgroundColor: surfaceMutedColor },
          ]}>
          <ThemedText style={[Typography.caption, { color: textMutedColor }]}>
            {t('bookCard.noCover')}
          </ThemedText>
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.resultTop}>
          <ThemedText numberOfLines={3} style={[Typography.bookTitle, { color: textColor }]}>
            {displayTitle}
          </ThemedText>
          {!!displayAuthor && (
            <ThemedText numberOfLines={1} style={[Typography.metadata, { color: textMutedColor }]}>
              {displayAuthor}
            </ThemedText>
          )}
        </View>
        <View style={styles.tagRow}>
          {genres.slice(0, 2).map((genre) => (
            <View key={genre} style={[styles.tag, { backgroundColor: accentSoftColor }]}>
              <ThemedText numberOfLines={1} style={[Typography.caption, { color: onAccentSoftColor }]}>
                {capitalizeFirst(genre)}
              </ThemedText>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.chevronCircle, styles.chevronCircleLibrary, { backgroundColor: accentSoftColor }]}>
        <IconSymbol name="chevron.right" size={22} color={onAccentSoftColor} />
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    flexDirection: 'row',
    borderRadius: 14,
    padding: 10,
    gap: 12,
    width: '100%',
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
  resultPressArea: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    minWidth: 0,
  },
  resultTop: {
    gap: 2,
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
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  coverList: {
    width: 40,
    height: 56,
    borderRadius: 6,
  },
  listBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  listTitle: {
    fontWeight: '600',
  },
  gridTile: {
    flex: 1,
    gap: 6,
  },
  coverGrid: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: 8,
  },
  coverGridClip: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  coverGridImage: {
    width: '100%',
    height: '100%',
  },
  gridPlaceholderText: {
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  gridTitle: {
    fontWeight: '600',
  },
});
