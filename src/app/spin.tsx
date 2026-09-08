import { router } from 'expo-router';
import { Dices } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import ConfettiCannon from 'react-native-confetti-cannon';

import { CoverImage } from '@/components/CoverImage';
import { IconSymbol } from '@/components/IconSymbol';
import { LibraryFiltersSheet } from '@/components/LibraryFiltersSheet';
import { Paywall } from '@/components/Paywall';
import { SpinReel } from '@/components/SpinReel';
import { ThemedText } from '@/components/ThemedText';
import { Typography } from '@/lib/theme/theme';
import { useBookFilters } from '@/hooks/useBookFilters';
import { useBooks } from '@/hooks/useLibrary';
import { usePurchases } from '@/hooks/usePurchases';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTranslation } from '@/hooks/useTranslation';
import { capitalizeFirst } from '@/lib/capitalize';
import { toHighResUrl } from '@/api/googleBooks';
import type { Book } from '@/types/book';

export default function SpinScreen() {
  const { t } = useTranslation();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textMutedColor = useThemeColor({}, 'textMuted');
  const accentColor = useThemeColor({}, 'accent');
  const onAccentColor = useThemeColor({}, 'onAccent');
  const surfaceColor = useThemeColor({}, 'surface');
  const surfaceMutedColor = useThemeColor({}, 'surfaceMuted');
  const shadowColor = useThemeColor({}, 'shadow');

  const { width: windowWidth } = useWindowDimensions();
  const confettiRef = useRef<ConfettiCannon>(null);
  const { isPro, isLoading: purchasesLoading } = usePurchases();

  const { data: books } = useBooks();
  const toReadBooks = useMemo(() => (books ?? []).filter((book) => book.status === 'to_read'), [books]);

  const {
    genreFilters,
    setGenreFilters,
    authorFilters,
    setAuthorFilters,
    languageFilters,
    setLanguageFilters,
    allGenres,
    allAuthors,
    allLanguages,
    genreTranslations,
    hasActiveFilters,
    activeFilterLabels,
    clearFilters,
    applyFilters,
  } = useBookFilters(toReadBooks);

  const candidates = useMemo(() => applyFilters(toReadBooks), [toReadBooks, applyFilters]);

  const [coversReady, setCoversReady] = useState(false);
  const handleReelReady = useCallback(() => setCoversReady(true), []);

  const [spinToken, setSpinToken] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [landedBook, setLandedBook] = useState<Book | null>(null);
  const [lastLandedId, setLastLandedId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setLandedBook(null);
    setLastLandedId(null);
    setShowConfetti(false);
  }, [genreFilters, authorFilters, languageFilters]);

  const handleSpinPress = useCallback(() => {
    setLandedBook(null);
    setIsSpinning(true);
    setShowConfetti(false);
    setSpinToken((token) => token + 1);
  }, []);

  const handleLanded = useCallback((book: Book) => {
    setLandedBook(book);
    setIsSpinning(false);
    setLastLandedId(book.id);
    setShowConfetti(true);
    confettiRef.current?.start();
  }, []);

  const coverUrl = toHighResUrl(landedBook?.thumbnailUrl);
  const spinButtonLabelKey = isSpinning
    ? 'spin.spinningButton'
    : landedBook
      ? 'spin.spinAgainButton'
      : 'spin.spinButton';

  const inviteScale = useSharedValue(1);
  useEffect(() => {
    if (isSpinning || landedBook) {
      inviteScale.value = withTiming(1, { duration: 150 });
      return;
    }
    inviteScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 550, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 550, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
  }, [isSpinning, landedBook, inviteScale]);

  const spinButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: inviteScale.value }],
  }));

  if (purchasesLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['bottom']}>
        <View style={styles.centered}>
          <ActivityIndicator color={accentColor} />
        </View>
      </SafeAreaView>
    );
  }

  if (!isPro) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor }]} edges={['bottom']}>
        <Paywall />
      </SafeAreaView>
    );
  }

  if (toReadBooks.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['bottom']}>
        <View style={styles.centered}>
          <Dices size={64} color={accentColor} strokeWidth={1.5} />
          <ThemedText style={[Typography.sectionTitle, styles.centeredText, { color: textColor }]}>
            {t('spin.emptyTitle')}
          </ThemedText>
          <ThemedText style={[Typography.body, styles.centeredText, { color: textMutedColor }]}>
            {t('spin.emptyText')}
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['bottom']}>
      <View style={styles.header}>
        <ThemedText style={[Typography.body, { color: textMutedColor }]}>{t('spin.subtitle')}</ThemedText>
      </View>

      <View style={styles.filterRow}>
        <LibraryFiltersSheet
          genreOptions={allGenres}
          genreLabels={genreTranslations}
          selectedGenres={genreFilters}
          onGenresChange={setGenreFilters}
          authorOptions={allAuthors}
          selectedAuthors={authorFilters}
          onAuthorsChange={setAuthorFilters}
          languageOptions={allLanguages}
          selectedLanguages={languageFilters}
          onLanguagesChange={setLanguageFilters}
          disabled={allGenres.length === 0 && allAuthors.length === 0 && allLanguages.length === 0}
        />
      </View>

      {hasActiveFilters && (
        <View style={[styles.activeFiltersRow, { backgroundColor: surfaceMutedColor }]}>
          <ThemedText
            numberOfLines={1}
            style={[Typography.caption, styles.activeFiltersText, { color: textMutedColor }]}>
            {t('library.filteringBy', { filters: activeFilterLabels.join(', ') })}
          </ThemedText>
          <Pressable
            onPress={clearFilters}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('library.clearFilters')}>
            <IconSymbol name="xmark.circle.fill" size={18} color={textMutedColor} />
          </Pressable>
        </View>
      )}

      {candidates.length === 0 ? (
        <View style={styles.centered}>
          <ThemedText style={[Typography.bookTitle, styles.centeredText, { color: textColor }]}>
            {t('library.noMatchTitle')}
          </ThemedText>
          <ThemedText style={[Typography.body, styles.centeredText, { color: textMutedColor }]}>
            {t('library.noMatchText')}
          </ThemedText>
          <Pressable
            onPress={clearFilters}
            accessibilityRole="button"
            accessibilityLabel={t('library.clearFilters')}
            style={[styles.clearButton, { backgroundColor: surfaceMutedColor }]}>
            <ThemedText style={[Typography.button, { color: accentColor }]}>{t('library.clearFilters')}</ThemedText>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.reelContainer}>
            <View style={{ opacity: coversReady ? 1 : 0 }}>
              <SpinReel
                candidates={candidates}
                spinToken={spinToken}
                excludeIdFromTarget={lastLandedId}
                onLanded={handleLanded}
                onReady={handleReelReady}
              />
            </View>
            {!coversReady && (
              <View style={styles.reelLoadingOverlay}>
                <ActivityIndicator color={accentColor} />
              </View>
            )}
          </View>

          <Animated.View style={spinButtonAnimatedStyle}>
            <Pressable
              onPress={handleSpinPress}
              disabled={isSpinning || !coversReady}
              accessibilityRole="button"
              accessibilityLabel={t(spinButtonLabelKey)}
              style={[
                styles.spinButton,
                { backgroundColor: isSpinning || !coversReady ? surfaceMutedColor : accentColor },
              ]}>
              <Dices
                size={20}
                color={isSpinning || !coversReady ? textMutedColor : onAccentColor}
                strokeWidth={1.75}
              />
              <ThemedText
                style={[Typography.button, { color: isSpinning || !coversReady ? textMutedColor : onAccentColor }]}>
                {t(spinButtonLabelKey)}
              </ThemedText>
            </Pressable>
          </Animated.View>

          {landedBook && (
            <Animated.View
              entering={FadeInUp.duration(420)}
              style={[styles.reveal, { backgroundColor: surfaceColor, boxShadow: `0px 4px 10px ${shadowColor}` }]}
              accessible
              accessibilityLabel={t('spin.landedAccessibilityLabel', {
                title: landedBook.title,
                author: landedBook.authors.join(', ') || t('bookCard.unknownAuthor'),
              })}>
              {coverUrl ? (
                <CoverImage uri={coverUrl} style={styles.revealCover} />
              ) : (
                <View
                  style={[styles.revealCover, styles.revealCoverPlaceholder, { backgroundColor: surfaceMutedColor }]}>
                  <ThemedText style={[Typography.caption, { color: textMutedColor }]}>
                    {t('bookCard.noCover')}
                  </ThemedText>
                </View>
              )}
              <ThemedText numberOfLines={2} style={[Typography.bookTitle, styles.centeredText, { color: textColor }]}>
                {capitalizeFirst(landedBook.title)}
              </ThemedText>
              {landedBook.authors.length > 0 && (
                <ThemedText numberOfLines={1} style={[Typography.metadata, { color: textMutedColor }]}>
                  {capitalizeFirst(landedBook.authors.join(', '))}
                </ThemedText>
              )}
              <Pressable
                onPress={() => router.push(`/book/${landedBook.id}`)}
                accessibilityRole="button"
                accessibilityLabel={t('spin.viewDetails')}
                style={[styles.viewDetailsButton, { backgroundColor: surfaceMutedColor }]}>
                <ThemedText style={[Typography.button, { color: accentColor }]}>{t('spin.viewDetails')}</ThemedText>
              </Pressable>
            </Animated.View>
          )}

          {showConfetti && (
            <ConfettiCannon ref={confettiRef} count={140} origin={{ x: windowWidth / 2, y: 0 }} autoStart fadeOut />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  reelContainer: {
    position: 'relative',
  },
  reelLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 24,
  },
  centeredText: {
    textAlign: 'center',
  },
  header: {
    gap: 4,
    paddingTop: 12,
    marginBottom: 4,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 14,
  },
  activeFiltersRow: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    maxWidth: '100%',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  activeFiltersText: {
    flexShrink: 1,
  },
  clearButton: {
    marginTop: 8,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  spinButton: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: 36,
    marginTop: 20,
  },
  reveal: {
    alignItems: 'center',
    gap: 6,
    marginTop: 28,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  revealCover: {
    width: 160,
    height: 240,
    borderRadius: 12,
    marginBottom: 10,
  },
  revealCoverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDetailsButton: {
    marginTop: 10,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
});
