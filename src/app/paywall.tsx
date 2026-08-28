import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Paywall } from '@/components/Paywall';
import { usePurchases } from '@/hooks/usePurchases';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function PaywallScreen() {
  const { isPro } = usePurchases();
  const backgroundColor = useThemeColor({}, 'background');

  useEffect(() => {
    if (isPro && router.canGoBack()) router.back();
  }, [isPro]);

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor }]} edges={['bottom']}>
      <Paywall />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
