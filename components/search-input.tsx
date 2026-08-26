import { Pressable, StyleSheet, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Typography } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslation } from '@/hooks/use-translation';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  autoFocus?: boolean;
  returnKeyType?: 'search' | 'done';
  style?: StyleProp<ViewStyle>;
}

export function SearchInput({
  value,
  onChangeText,
  placeholder,
  autoFocus,
  returnKeyType,
  style,
}: SearchInputProps) {
  const { t } = useTranslation();
  const surfaceMutedColor = useThemeColor({}, 'surfaceMuted');
  const textColor = useThemeColor({}, 'text');
  const textMutedColor = useThemeColor({}, 'textMuted');

  return (
    <View style={[styles.searchBox, { backgroundColor: surfaceMutedColor }, style]}>
      <IconSymbol name="magnifyingglass" size={18} color={textMutedColor} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={textMutedColor}
        style={[Typography.body, styles.searchInput, { color: textColor }]}
        autoCorrect={false}
        returnKeyType={returnKeyType}
        autoFocus={autoFocus}
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('common.clear')}>
          <IconSymbol name="xmark.circle.fill" size={18} color={textMutedColor} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    borderRadius: 12,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
  },
});
