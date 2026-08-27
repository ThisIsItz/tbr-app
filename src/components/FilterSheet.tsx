import type { LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/IconSymbol';
import { Typography } from '@/lib/theme/theme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTranslation } from '@/hooks/useTranslation';

export interface FilterOption {
  value: string | null;
  label: string;
}

interface FilterSheetProps {
  label: string;
  options: FilterOption[];
  selected: string | null;
  onSelect: (value: string | null) => void;
  selectedLabel?: string | null;
  disabled?: boolean;
  /** Leading icon shown before the label on the trigger. */
  icon?: LucideIcon;
  /** Sizes the trigger to its content instead of stretching to fill the row. */
  compact?: boolean;
}

export function FilterSheet({
  label,
  options,
  selected,
  onSelect,
  selectedLabel,
  disabled,
  icon: Icon,
  compact,
}: FilterSheetProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const isActive = selected !== null && selected !== undefined;

  const surfaceColor = useThemeColor({}, 'surface');
  const surfaceMutedColor = useThemeColor({}, 'surfaceMuted');
  const textColor = useThemeColor({}, 'text');
  const textMutedColor = useThemeColor({}, 'textMuted');
  const accentColor = useThemeColor({}, 'accent');
  const accentSoftColor = useThemeColor({}, 'accentSoft');
  const onAccentSoftColor = useThemeColor({}, 'onAccentSoft');

  return (
    <>
      <Pressable
        disabled={disabled}
        onPress={() => setVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={isActive ? (selectedLabel ?? label) : label}
        style={[
          styles.trigger,
          compact && styles.triggerCompact,
          {
            backgroundColor: isActive ? accentSoftColor : surfaceMutedColor,
            opacity: disabled ? 0.5 : 1,
          },
        ]}>
        {Icon && <Icon size={16} color={isActive ? onAccentSoftColor : textColor} strokeWidth={2} />}
        <ThemedText
          numberOfLines={1}
          style={[Typography.button, styles.triggerText, { color: isActive ? onAccentSoftColor : textColor }]}>
          {isActive ? (selectedLabel ?? label) : label}
        </ThemedText>
        <IconSymbol name="chevron.down" size={16} color={isActive ? onAccentSoftColor : textMutedColor} />
      </Pressable>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable
          style={styles.backdrop}
          onPress={() => setVisible(false)}
          accessibilityRole="button"
          accessibilityLabel={t('common.done')}>
          <Pressable
            style={[styles.sheet, { backgroundColor: surfaceColor }]}
            onPress={(e) => e.stopPropagation()}>
            <ThemedText style={[Typography.sectionTitle, styles.sheetTitle, { color: textColor }]}>
              {label}
            </ThemedText>
            <FlatList
              data={options}
              keyExtractor={(item) => item.label}
              style={styles.optionList}
              renderItem={({ item }) => {
                const isSelected = item.value === selected;
                return (
                  <Pressable
                    onPress={() => {
                      onSelect(item.value);
                      setVisible(false);
                    }}
                    accessibilityRole="radio"
                    accessibilityLabel={item.label}
                    accessibilityState={{ selected: isSelected }}
                    style={styles.optionRow}>
                    <ThemedText
                      style={[
                        Typography.body,
                        {
                          color: isSelected ? accentColor : textColor,
                          fontWeight: isSelected ? '700' : '400',
                        },
                      ]}>
                      {item.label}
                    </ThemedText>
                    {isSelected && <IconSymbol name="checkmark" size={18} color={accentColor} />}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 44,
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  triggerCompact: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    paddingHorizontal: 14,
  },
  triggerText: {
    flexShrink: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 32,
    maxHeight: '70%',
  },
  sheetTitle: {
    marginBottom: 8,
  },
  optionList: {
    flexGrow: 0,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingVertical: 8,
  },
});
