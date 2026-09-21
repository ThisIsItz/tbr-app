import { Search } from 'lucide-react-native';
import { Pressable, StyleSheet, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';

import { IconSymbol } from '@/components/IconSymbol';
import { ThemedText } from '@/components/ThemedText';
import { Typography } from '@/lib/theme/theme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTranslation } from '@/hooks/useTranslation';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  autoFocus?: boolean;
  returnKeyType?: 'search' | 'done';
  onSubmit?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function SearchInput({
  value,
  onChangeText,
  placeholder,
  autoFocus,
  returnKeyType,
  onSubmit,
  style,
}: SearchInputProps) {
  const { t } = useTranslation();
  const surfaceMutedColor = useThemeColor({}, 'surfaceMuted');
  const textColor = useThemeColor({}, 'text');
  const textMutedColor = useThemeColor({}, 'textMuted');
  const accentColor = useThemeColor({}, 'accent');
  const onAccentColor = useThemeColor({}, 'onAccent');

  return (
    <View style={[styles.row, style]}>
      <View style={[styles.searchBox, { backgroundColor: surfaceMutedColor }]}>
        <Search size={18} color={textMutedColor} strokeWidth={1.75} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={textMutedColor}
          style={[Typography.body, styles.searchInput, { color: textColor }]}
          autoCorrect={false}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmit}
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
      {onSubmit && value.length > 0 && (
        <Pressable
          onPress={onSubmit}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('search.searchButton')}
          style={[styles.submitButton, { backgroundColor: accentColor }]}>
          <ThemedText style={[Typography.button, { color: onAccentColor }]}>{t('search.searchButton')}</ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchBox: {
    flex: 1,
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
  submitButton: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
