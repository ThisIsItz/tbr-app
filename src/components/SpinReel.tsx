import { Image } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { Typography } from '@/lib/theme/theme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTranslation } from '@/hooks/useTranslation';
import { toHttpsUrl } from '@/api/googleBooks';
import type { Book } from '@/types/book';

const ITEM_WIDTH = 128;
const ITEM_GAP = 16;
const PITCH = ITEM_WIDTH + ITEM_GAP;
const COVER_WIDTH = 112;
const COVER_HEIGHT = 168;
const VIEWPORT_HEIGHT = 204;
const REEL_LENGTH = 26;
const SPIN_EASING = Easing.bezier(0.16, 1, 0.3, 1);
const SPIN_DURATION = 3400;

interface SpinReelProps {
  candidates: Book[];
  spinToken: number;
  excludeIdFromTarget?: string | null;
  onLanded: (book: Book) => void;
}

export function SpinReel({ candidates, spinToken, excludeIdFromTarget, onLanded }: SpinReelProps) {
  const accentColor = useThemeColor({}, 'accent');
  const translateX = useSharedValue(0);
  const [items, setItems] = useState<Book[] | null>(null);
  const [viewportWidth, setViewportWidth] = useState(Dimensions.get('window').width);

  const candidatesRef = useRef(candidates);
  candidatesRef.current = candidates;
  const excludeIdRef = useRef(excludeIdFromTarget);
  excludeIdRef.current = excludeIdFromTarget;
  const onLandedRef = useRef(onLanded);
  onLandedRef.current = onLanded;
  const currentBookRef = useRef<Book | null>(null);

  const centerXForIndex = useCallback(
    (index: number) => -(index * PITCH) + (viewportWidth / 2 - ITEM_WIDTH / 2),
    [viewportWidth],
  );

  const buildFiller = useCallback(
    (pool: Book[]) => {
      const count = Math.ceil(viewportWidth / PITCH) + 2;
      const filler: Book[] = [];
      for (let i = 0; i < count; i++) {
        filler.push(pool[i % pool.length]);
      }
      return filler;
    },
    [viewportWidth],
  );

  const rotateToStart = useCallback((pool: Book[], startBook: Book) => {
    const startIndex = pool.findIndex((book) => book.id === startBook.id);
    if (startIndex <= 0) return pool;
    return [...pool.slice(startIndex), ...pool.slice(0, startIndex)];
  }, []);

  useEffect(() => {
    if (items || spinToken > 0) return;
    const pool = candidatesRef.current;
    if (pool.length === 0) return;

    const leading = buildFiller(pool);
    const trailing = buildFiller(pool);

    currentBookRef.current = pool[0];
    translateX.value = centerXForIndex(leading.length);
    setItems([...leading, ...pool, ...trailing]);
  }, [items, spinToken, candidates.length, viewportWidth, translateX, buildFiller, centerXForIndex]);

  useEffect(() => {
    if (spinToken > 0 || !items) return;
    const pool = candidatesRef.current;
    if (pool.length === 0) return;
    translateX.value = centerXForIndex(buildFiller(pool).length);
  }, [viewportWidth, spinToken, items, translateX, buildFiller, centerXForIndex]);

  useEffect(() => {
    if (spinToken === 0) return;

    const pool = candidatesRef.current;
    if (pool.length === 0) return;

    const pickPool =
      excludeIdRef.current && pool.length > 1 ? pool.filter((book) => book.id !== excludeIdRef.current) : pool;
    const target = pickPool[Math.floor(Math.random() * pickPool.length)];

    const startBook = currentBookRef.current ?? pool[0];
    const rotatedPool = rotateToStart(pool, startBook);
    const leading = buildFiller(pool);
    const trailing = buildFiller(pool);

    const loops: Book[] = [];
    for (let i = 0; i < REEL_LENGTH; i++) {
      loops.push(rotatedPool[i % rotatedPool.length]);
    }
    loops.push(target);

    const startIndex = leading.length;
    const finalIndex = leading.length + loops.length - 1;
    const finalX = centerXForIndex(finalIndex);

    setItems([...leading, ...loops, ...trailing]);
    translateX.value = centerXForIndex(startIndex);
    translateX.value = withTiming(finalX, { duration: SPIN_DURATION, easing: SPIN_EASING }, (finished) => {
      if (finished) {
        runOnJS((book: Book) => {
          currentBookRef.current = book;
          onLandedRef.current(book);
        })(target);
      }
    });
  }, [spinToken, translateX, buildFiller, centerXForIndex, rotateToStart]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  function handleLayout(event: LayoutChangeEvent) {
    const width = event.nativeEvent.layout.width;
    if (width !== viewportWidth) setViewportWidth(width);
  }

  return (
    <View style={styles.viewport} onLayout={handleLayout}>
      {items && (
        <Animated.View style={[styles.row, animatedStyle]}>
          {items.map((book, index) => (
            <ReelItem
              key={`${book.id}-${index}`}
              book={book}
              index={index}
              translateX={translateX}
              viewportWidth={viewportWidth}
            />
          ))}
        </Animated.View>
      )}
      <View
        pointerEvents="none"
        style={[
          styles.indicator,
          { left: viewportWidth / 2 - (ITEM_WIDTH / 2 + 4), borderColor: accentColor },
        ]}
      />
    </View>
  );
}

interface ReelItemProps {
  book: Book;
  index: number;
  translateX: SharedValue<number>;
  viewportWidth: number;
}

function ReelItem({ book, index, translateX, viewportWidth }: ReelItemProps) {
  const surfaceMutedColor = useThemeColor({}, 'surfaceMuted');
  const textMutedColor = useThemeColor({}, 'textMuted');
  const { t } = useTranslation();
  const coverUrl = toHttpsUrl(book.thumbnailUrl);
  const [failed, setFailed] = useState(false);

  const itemCenterX = index * PITCH + ITEM_WIDTH / 2;
  const scaleStyle = useAnimatedStyle(() => {
    const distance = Math.abs(translateX.value + itemCenterX - viewportWidth / 2);
    const scale = interpolate(distance, [0, PITCH], [1, 0.85], Extrapolation.CLAMP);
    return { transform: [{ scale }] };
  });

  return (
    <Animated.View style={[styles.item, scaleStyle]}>
      {coverUrl && !failed ? (
        <Image
          source={{ uri: coverUrl }}
          style={styles.cover}
          contentFit="cover"
          onError={(e) => {
            console.warn('[SpinReel] cover failed to load:', coverUrl, e.error);
            setFailed(true);
          }}
        />
      ) : (
        <View style={[styles.cover, styles.coverPlaceholder, { backgroundColor: surfaceMutedColor }]}>
          <ThemedText style={[Typography.caption, { color: textMutedColor }]}>{t('bookCard.noCover')}</ThemedText>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    height: VIEWPORT_HEIGHT,
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  item: {
    width: ITEM_WIDTH,
    marginRight: ITEM_GAP,
    alignItems: 'center',
  },
  cover: {
    width: COVER_WIDTH,
    height: COVER_HEIGHT,
    borderRadius: 8,
  },
  coverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  indicator: {
    position: 'absolute',
    top: 6,
    width: ITEM_WIDTH + 8,
    height: VIEWPORT_HEIGHT - 12,
    borderWidth: 3,
    borderRadius: 12,
  },
});
