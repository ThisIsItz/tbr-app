import { PartyPopper } from 'lucide-react-native';
import { useEffect } from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import ConfettiCannon from 'react-native-confetti-cannon';

import { ThemedText } from '@/components/ThemedText';
import { Typography } from '@/lib/theme/theme';
import { usePurchases } from '@/hooks/usePurchases';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTranslation } from '@/hooks/useTranslation';

const DISMISS_AFTER_MS = 4200;

export function PurchaseCelebration() {
  const { justPurchased, dismissJustPurchased } = usePurchases();
  const { t } = useTranslation();
  const { width: windowWidth } = useWindowDimensions();
  const surfaceColor = useThemeColor({}, 'surface');
  const textColor = useThemeColor({}, 'text');
  const accentColor = useThemeColor({}, 'accent');
  const shadowColor = useThemeColor({}, 'shadow');

  useEffect(() => {
    if (!justPurchased) return;
    const timeout = setTimeout(dismissJustPurchased, DISMISS_AFTER_MS);
    return () => clearTimeout(timeout);
  }, [justPurchased, dismissJustPurchased]);

  if (!justPurchased) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <ConfettiCannon count={140} origin={{ x: windowWidth / 2, y: 0 }} autoStart fadeOut />
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={[
          styles.toast,
          { backgroundColor: surfaceColor, shadowColor },
          Platform.OS === 'web' && { boxShadow: `0px 4px 16px ${shadowColor}` },
        ]}>
        <PartyPopper size={20} color={accentColor} strokeWidth={1.75} />
        <ThemedText style={[Typography.button, { color: textColor }]}>{t('paywall.purchaseSuccess')}</ThemedText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 64,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 6,
  },
});
