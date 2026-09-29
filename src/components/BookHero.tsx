import { ArrowLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoverImage } from '@/components/CoverImage';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTranslation } from '@/hooks/useTranslation';
import { capitalizeFirst } from '@/lib/capitalize';
import { getLanguageName } from '@/lib/languageNames';
import { getPublishedYear } from '@/lib/publishedYear';
import { Typography } from '@/lib/theme/theme';

interface BookHeroProps {
  title: string;
  subtitle?: string | null;
  authors: string[];
  coverUrl: string | null;
  // Set when coverUrl is already confirmed-final — skips the hi-res check.
  skipCoverCheck?: boolean;
  pageCount?: number | null;
  language?: string | null;
  publishedDate?: string | null;
  onBack: () => void;
  onCoverPress?: () => void;
  topRight?: ReactNode;
  bottomRight?: ReactNode;
  belowMetadata?: ReactNode;
}

export function BookHero({
  title,
  subtitle,
  authors,
  coverUrl,
  skipCoverCheck = false,
  pageCount,
  language,
  publishedDate,
  onBack,
  onCoverPress,
  topRight,
  bottomRight,
  belowMetadata,
}: BookHeroProps) {
  const { t, locale } = useTranslation();
  const insets = useSafeAreaInsets();
  const surfaceMutedColor = useThemeColor({}, 'surfaceMuted');

  const coverFallbackUri = skipCoverCheck ? null : undefined;

  const metadataParts = [
    publishedDate && getPublishedYear(publishedDate),
    !!pageCount && t(pageCount === 1 ? 'bookDetail.onePage' : 'bookDetail.pagesCount', { count: pageCount }),
    language && language !== locale && getLanguageName(language, locale),
  ].filter((part): part is string => !!part);

  return (
    <View style={styles.hero}>
      {coverUrl ? (
        <CoverImage uri={coverUrl} fallbackUri={coverFallbackUri} style={StyleSheet.absoluteFill} blurRadius={30} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: surfaceMutedColor }]} />
      )}
      <View style={[StyleSheet.absoluteFill, styles.scrim]} />

      <View style={[styles.content, { paddingTop: insets.top + 16 }]}>
        <View style={styles.topRow}>
          <CircleButton onPress={onBack} accessibilityLabel={t('common.back')}>
            <ArrowLeft size={20} color="#1A1310" strokeWidth={2} />
          </CircleButton>
          {topRight && <View style={styles.topRightRow}>{topRight}</View>}
        </View>

        <View style={styles.bookRow}>
          {coverUrl ? (
            <Pressable
              onPress={onCoverPress}
              disabled={!onCoverPress}
              accessibilityRole={onCoverPress ? 'button' : undefined}
              accessibilityLabel={onCoverPress ? t('bookDetail.viewCover') : undefined}>
              <CoverImage uri={coverUrl} fallbackUri={coverFallbackUri} style={styles.thumbnail} />
            </Pressable>
          ) : (
            <View style={[styles.thumbnail, styles.thumbnailPlaceholder, { backgroundColor: surfaceMutedColor }]}>
              <ThemedText style={[Typography.caption, styles.heroTextMuted]}>{t('bookCard.noCover')}</ThemedText>
            </View>
          )}
          <View style={styles.bookText}>
            <ThemedText style={[Typography.screenTitle, styles.heroTitle]}>{capitalizeFirst(title)}</ThemedText>
            {subtitle && <ThemedText style={[styles.heroSubtitle]}>{capitalizeFirst(subtitle)}</ThemedText>}
            {authors.length > 0 && (
              <ThemedText style={[styles.heroAuthor]}>{capitalizeFirst(authors.join(', '))}</ThemedText>
            )}
            {metadataParts.length > 0 && (
              <ThemedText style={[Typography.caption, styles.heroMetadata]}>
                {metadataParts.join('  ·  ')}
              </ThemedText>
            )}
            {belowMetadata && <View style={styles.belowMetadataRow}>{belowMetadata}</View>}
          </View>
        </View>

        {bottomRight && <View style={styles.bottomRightRow}>{bottomRight}</View>}
      </View>
    </View>
  );
}

interface CircleButtonProps {
  onPress: () => void;
  accessibilityLabel: string;
  children: ReactNode;
  tint?: string;
}

export function CircleButton({ onPress, accessibilityLabel, children, tint }: CircleButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[styles.circleButton, tint ? { backgroundColor: tint } : styles.circleButtonDefault]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: {
    overflow: 'hidden',
  },
  scrim: {
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topRightRow: {
    flexDirection: 'row',
    gap: 10,
  },
  circleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleButtonDefault: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  bookRow: {
    flexDirection: 'row',
    gap: 16,
  },
  thumbnail: {
    width: 135,
    height: 202,
    borderRadius: 10,
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  bookText: {
    flex: 1,
    gap: 4,
    paddingTop: 4,
  },
  heroTitle: {
    color: '#FFFFFF',
  },
  heroSubtitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  heroAuthor: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.75)',
  },
  heroMetadata: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  heroTextMuted: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  belowMetadataRow: {
    marginTop: 'auto',
    alignSelf: 'flex-end',
  },
  bottomRightRow: {
    alignItems: 'flex-end',
  },
});
