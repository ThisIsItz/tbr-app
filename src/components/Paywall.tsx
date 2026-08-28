import { BookMarked, Camera, Dices, ImageUp, Palette } from 'lucide-react-native';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Typography } from '@/lib/theme/theme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTranslation } from '@/hooks/useTranslation';
import { usePurchases } from '@/hooks/usePurchases';

const FEATURES = [
  { icon: Camera, titleKey: 'paywall.featureScanTitle', bodyKey: 'paywall.featureScanBody' },
  { icon: ImageUp, titleKey: 'paywall.featureUploadTitle', bodyKey: 'paywall.featureUploadBody' },
  { icon: Dices, titleKey: 'paywall.featureSpinTitle', bodyKey: 'paywall.featureSpinBody' },
  { icon: Palette, titleKey: 'paywall.featureColorsTitle', bodyKey: 'paywall.featureColorsBody' },
] as const;

export function Paywall() {
  const { t } = useTranslation();
  const { isLoading, offering, error, purchase, restore } = usePurchases();
  const backgroundColor = useThemeColor({}, 'background');
  const surfaceColor = useThemeColor({}, 'surface');
  const surfaceMutedColor = useThemeColor({}, 'surfaceMuted');
  const textColor = useThemeColor({}, 'text');
  const textMutedColor = useThemeColor({}, 'textMuted');
  const accentColor = useThemeColor({}, 'accent');
  const accentSoftColor = useThemeColor({}, 'accentSoft');
  const onAccentColor = useThemeColor({}, 'onAccent');
  const shadowColor = useThemeColor({}, 'shadow');
  const dangerColor = useThemeColor({}, 'danger');

  const price = offering?.availablePackages[0]?.product.priceString;

  return (
    <View style={[styles.root, { backgroundColor }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: accentSoftColor }]}>
          <BookMarked size={68} color={accentColor} strokeWidth={1.5} />
        </View>

        <ThemedText style={[Typography.screenTitle, styles.centeredText, { color: textColor }]}>
          {t('paywall.title')}
        </ThemedText>
        <ThemedText style={[Typography.body, styles.centeredText, styles.subtitle, { color: textMutedColor }]}>
          {t('paywall.subtitle')}
        </ThemedText>

        <View
          style={[
            styles.featuresCard,
            { backgroundColor: surfaceColor, shadowColor },
            Platform.OS === 'web' && { boxShadow: `0px 3px 12px ${shadowColor}` },
          ]}>
          {FEATURES.map(({ icon: Icon, titleKey, bodyKey }, index) => (
            <View
              key={titleKey}
              style={[
                styles.featureRow,
                index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: surfaceMutedColor },
              ]}>
              <View style={[styles.featureIconWrap, { backgroundColor: accentSoftColor }]}>
                <Icon size={21} color={accentColor} strokeWidth={1.75} />
              </View>
              <View style={styles.featureText}>
                <ThemedText style={[Typography.bookTitle, { color: textColor }]}>{t(titleKey)}</ThemedText>
                <ThemedText style={[Typography.metadata, { color: textMutedColor }]}>{t(bodyKey)}</ThemedText>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {error && (
          <ThemedText style={[Typography.caption, styles.centeredText, { color: dangerColor }]}>
            {t(error === 'purchase' ? 'paywall.purchaseError' : 'paywall.restoreError')}
          </ThemedText>
        )}

        <Pressable
          onPress={purchase}
          disabled={isLoading || !offering}
          accessibilityRole="button"
          accessibilityLabel={t('paywall.unlockButton')}
          style={[
            styles.primaryButton,
            { backgroundColor: isLoading || !offering ? surfaceMutedColor : accentColor, shadowColor },
          ]}>
          <ThemedText
            style={[Typography.button, { color: isLoading || !offering ? textMutedColor : onAccentColor }]}>
            {price ? t('paywall.unlockButtonWithPrice', { price }) : t('paywall.unlockButton')}
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={restore}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel={t('paywall.restoreButton')}
          style={styles.restoreButton}>
          <ThemedText style={[Typography.button, { color: accentColor }]}>
            {t('paywall.restoreButton')}
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  hero: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  centeredText: {
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  featuresCard: {
    width: '100%',
    borderRadius: 16,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  featureIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    gap: 2,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 4,
  },
  primaryButton: {
    width: '100%',
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  restoreButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
});
