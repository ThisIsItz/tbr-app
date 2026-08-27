import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

interface HeaderIconActionProps {
  icon: LucideIcon;
  color: string;
  label: string;
  onPress: () => void;
}

export function HeaderIconAction({ icon: Icon, color, label, onPress }: HeaderIconActionProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.action}>
      <Icon size={22} color={color} strokeWidth={1.75} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  action: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
});
