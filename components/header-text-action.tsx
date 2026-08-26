import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Typography } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

interface HeaderTextActionProps {
  label: string;
  onPress: () => void;
}

export function HeaderTextAction({ label, onPress }: HeaderTextActionProps) {
  const accentColor = useThemeColor({}, 'accent');

  return (
    <Pressable onPress={onPress} hitSlop={8} style={styles.action}>
      <ThemedText style={[Typography.button, { color: accentColor }]}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  action: {
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 16,
  },
});
