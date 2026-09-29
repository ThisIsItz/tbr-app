import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export function ScreenLoading() {
  const backgroundColor = useThemeColor({}, 'background');
  const accentColor = useThemeColor({}, 'accent');

  return (
    <View style={[styles.centered, { backgroundColor }]}>
      <ActivityIndicator color={accentColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
