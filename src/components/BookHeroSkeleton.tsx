import { ArrowLeft } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CircleButton } from '@/components/BookHero';
import { Skeleton } from '@/components/Skeleton';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTranslation } from '@/hooks/useTranslation';

const BAR_TINT = 'rgba(255, 255, 255, 0.35)';

interface BookHeroSkeletonProps {
  onBack: () => void;
}

export function BookHeroSkeleton({ onBack }: BookHeroSkeletonProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const surfaceMutedColor = useThemeColor({}, 'surfaceMuted');

  return (
    <View style={styles.hero}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: surfaceMutedColor }]} />
      <View style={[StyleSheet.absoluteFill, styles.scrim]} />

      <View style={[styles.content, { paddingTop: insets.top + 16 }]}>
        <View style={styles.topRow}>
          <CircleButton onPress={onBack} accessibilityLabel={t('common.back')}>
            <ArrowLeft size={20} color="#1A1310" strokeWidth={2} />
          </CircleButton>
        </View>

        <View style={styles.bookRow}>
          <Skeleton width={135} height={202} borderRadius={10} tint={BAR_TINT} />
          <View style={styles.bookText}>
            <Skeleton width="85%" height={26} tint={BAR_TINT} />
            <Skeleton width="60%" height={18} tint={BAR_TINT} style={styles.gapTop} />
            <Skeleton width="50%" height={16} tint={BAR_TINT} style={styles.gapTop} />
            <Skeleton width="40%" height={14} tint={BAR_TINT} style={styles.gapTop} />
          </View>
        </View>

        <View style={styles.bottomRightRow}>
          <Skeleton width={100} height={44} borderRadius={22} tint="rgba(255, 255, 255, 0.6)" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    overflow: 'hidden',
  },
  scrim: {
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
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
  bookRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  bookText: {
    flex: 1,
    gap: 4,
    paddingTop: 4,
  },
  gapTop: {
    marginTop: 6,
  },
  bottomRightRow: {
    alignItems: 'flex-end',
  },
});
