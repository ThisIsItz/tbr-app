import { Image } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
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

const REEL_LENGTH = 26;
const SPIN_EASING = Easing.bezier(0.16, 1, 0.3, 1);
const SPIN_DURATION = 3400;

function getLayout(viewportWidth: number) {
  const itemWidth = Math.min(160, Math.max(100, viewportWidth * 0.38));
  const itemGap = itemWidth * 0.06;
  const pitch = itemWidth + itemGap;
  const coverWidth = itemWidth * 0.92;
  const coverHeight = coverWidth * 1.5;
  const viewportHeight = coverHeight + 36;
  return { itemWidth, itemGap, pitch, coverWidth, coverHeight, viewportHeight };
}

interface SpinReelProps {
  candidates: Book[];
  spinToken: number;
  excludeIdFromTarget?: string | null;
  onLanded: (book: Book) => void;
  onReady?: () => void;
}

export function SpinReel({ candidates, spinToken, excludeIdFromTarget, onLanded, onReady }: SpinReelProps) {
  const accentColor = useThemeColor({}, 'accent');
  const translateX = useSharedValue(0);
  const [items, setItems] = useState<Book[] | null>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const layout = getLayout(viewportWidth);
  const { itemWidth, pitch, viewportHeight } = layout;

  const candidatesRef = useRef(candidates);
  const excludeIdRef = useRef(excludeIdFromTarget);
  const onLandedRef = useRef(onLanded);
  const currentBookRef = useRef<Book | null>(null);
  const centerIndexRef = useRef(0);
  const onReadyRef = useRef(onReady);

  useEffect(() => {
    candidatesRef.current = candidates;
    excludeIdRef.current = excludeIdFromTarget;
    onLandedRef.current = onLanded;
    onReadyRef.current = onReady;
  });

  const readyFiredRef = useRef(false);
  const readyTotalRef = useRef(0);
  const readySettledRef = useRef(0);

  const handleItemSettled = useCallback(() => {
    if (readyFiredRef.current) return;
    readySettledRef.current += 1;
    if (readySettledRef.current >= readyTotalRef.current) {
      readyFiredRef.current = true;
      onReadyRef.current?.();
    }
  }, []);

  const centerXForIndex = useCallback(
    (index: number) => -(index * pitch) + (viewportWidth / 2 - itemWidth / 2),
    [viewportWidth, pitch, itemWidth],
  );

  const buildFiller = useCallback(
    (pool: Book[]) => {
      const count = Math.ceil(viewportWidth / pitch) + 2;
      const filler: Book[] = [];
      for (let i = 0; i < count; i++) {
        filler.push(pool[i % pool.length]);
      }
      return filler;
    },
    [viewportWidth, pitch],
  );

  const rotateToStart = useCallback((pool: Book[], startBook: Book) => {
    const startIndex = pool.findIndex((book) => book.id === startBook.id);
    if (startIndex <= 0) return pool;
    return [...pool.slice(startIndex), ...pool.slice(0, startIndex)];
  }, []);

  const handleSpinComplete = useCallback((book: Book, landedIndex: number) => {
    currentBookRef.current = book;
    centerIndexRef.current = landedIndex;
    onLandedRef.current(book);
  }, []);

  useEffect(() => {
    if (items || spinToken > 0 || viewportWidth === 0) return;
    const pool = candidatesRef.current;
    if (pool.length === 0) return;

    const leading = buildFiller(pool);
    const trailing = buildFiller(pool);

    currentBookRef.current = pool[0];
    centerIndexRef.current = leading.length;
    translateX.value = centerXForIndex(leading.length);
    const initialItems = [...leading, ...pool, ...trailing];
    readyTotalRef.current = initialItems.length;
    readySettledRef.current = 0;
    setItems(initialItems);
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

    // index 0 of rotatedPool is startBook, which is already sitting at centerIndexRef.current,
    // so the loop continues from index 1 instead of repeating it.
    const loops: Book[] = [];
    for (let i = 1; i < REEL_LENGTH; i++) {
      loops.push(rotatedPool[i % rotatedPool.length]);
    }
    if (loops.length > 0 && rotatedPool.length > 1 && loops[loops.length - 1].id === target.id) {
      loops[loops.length - 1] = rotatedPool[REEL_LENGTH % rotatedPool.length];
    }
    loops.push(target);

    const rotatedFromTarget = rotateToStart(pool, target);
    const afterTarget = [...rotatedFromTarget.slice(1), rotatedFromTarget[0]];
    const trailing = buildFiller(afterTarget);
    const baseIndex = centerIndexRef.current;
    const finalIndex = baseIndex + loops.length;
    const finalX = centerXForIndex(finalIndex);

    // Extend the existing row past the currently centered item instead of swapping in a
    // whole new array — translateX keeps animating from wherever it already is, so there's
    // no jump to a differently-shaped row and nothing to visually desync at the start.
    setItems((prev) => [...(prev ?? []).slice(0, baseIndex + 1), ...loops, ...trailing]);

    translateX.value = withTiming(finalX, { duration: SPIN_DURATION, easing: SPIN_EASING }, (finished) => {
      if (finished) {
        runOnJS(handleSpinComplete)(target, finalIndex);
      }
    });
  }, [spinToken, translateX, buildFiller, centerXForIndex, rotateToStart, handleSpinComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  function handleLayout(event: LayoutChangeEvent) {
    const width = event.nativeEvent.layout.width;
    if (width !== viewportWidth) setViewportWidth(width);
  }

  return (
    <View style={[styles.viewport, { height: viewportHeight }]} onLayout={handleLayout}>
      {items && (
        <Animated.View style={[styles.row, animatedStyle]}>
          {items.map((book, index) => (
            <ReelItem
              key={`${book.id}-${index}`}
              book={book}
              index={index}
              translateX={translateX}
              viewportWidth={viewportWidth}
              layout={layout}
              onSettled={handleItemSettled}
            />
          ))}
        </Animated.View>
      )}
      {viewportWidth > 0 && (
        <View
          style={[
            styles.indicator,
            {
              left: viewportWidth / 2 - (itemWidth / 2 + 4),
              width: itemWidth + 8,
              height: viewportHeight - 12,
              borderColor: accentColor,
              pointerEvents: 'none',
            },
          ]}
        />
      )}
    </View>
  );
}

interface ReelItemProps {
  book: Book;
  index: number;
  translateX: SharedValue<number>;
  viewportWidth: number;
  layout: ReturnType<typeof getLayout>;
  onSettled: () => void;
}

function ReelItem({ book, index, translateX, viewportWidth, layout, onSettled }: ReelItemProps) {
  const surfaceMutedColor = useThemeColor({}, 'surfaceMuted');
  const textMutedColor = useThemeColor({}, 'textMuted');
  const { t } = useTranslation();
  const coverUrl = toHttpsUrl(book.thumbnailUrl);
  const [failed, setFailed] = useState(false);
  const { itemWidth, itemGap, pitch, coverWidth, coverHeight } = layout;

  const onSettledRef = useRef(onSettled);
  useEffect(() => {
    onSettledRef.current = onSettled;
  });
  const settledOnceRef = useRef(false);
  const markSettled = useCallback(() => {
    if (settledOnceRef.current) return;
    settledOnceRef.current = true;
    onSettledRef.current();
  }, []);

  useEffect(() => {
    if (!coverUrl) markSettled();
  }, [coverUrl, markSettled]);

  const itemCenterX = index * pitch + itemWidth / 2;
  const scaleStyle = useAnimatedStyle(() => {
    const distance = Math.abs(translateX.value + itemCenterX - viewportWidth / 2);
    const scale = interpolate(distance, [0, pitch], [1, 0.94], Extrapolation.CLAMP);
    return { transform: [{ scale }] };
  });

  return (
    <Animated.View style={[styles.item, { width: itemWidth, marginRight: itemGap }, scaleStyle]}>
      {/* The placeholder is always mounted underneath so a freshly-mounted Image (every
          re-spin appends new keys, even for repeat books) never leaves a blank frame
          while it loads or fails — it just uncovers the placeholder that was already there. */}
      <View
        style={[
          styles.coverPlaceholder,
          { width: coverWidth, height: coverHeight, borderRadius: 8, backgroundColor: surfaceMutedColor },
        ]}>
        <ThemedText style={[Typography.caption, { color: textMutedColor }]}>{t('bookCard.noCover')}</ThemedText>
        {coverUrl && !failed && (
          <Image
            source={{ uri: coverUrl }}
            style={[StyleSheet.absoluteFillObject, { borderRadius: 8 }]}
            contentFit="cover"
            onLoad={markSettled}
            onError={(e) => {
              console.warn('[SpinReel] cover failed to load:', coverUrl, e.error);
              setFailed(true);
              markSettled();
            }}
          />
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  item: {
    alignItems: 'center',
  },
  coverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute',
    top: 6,
    borderWidth: 3,
    borderRadius: 12,
  },
});
