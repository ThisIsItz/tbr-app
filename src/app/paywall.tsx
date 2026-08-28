import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Paywall } from '@/components/Paywall';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function PaywallScreen() {
  const backgroundColor = useThemeColor({}, 'background');

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
