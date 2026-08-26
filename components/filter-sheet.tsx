import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Typography } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

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
  /** When true, the trigger always shows `label` and never switches to the
   * active/selected styling — for controls like Sort that always have a
   * value rather than an on/off filter. */
  staticLabel?: boolean;
}

export function FilterSheet({
  label,
  options,
  selected,
  onSelect,
  selectedLabel,
  disabled,
  staticLabel,
}: FilterSheetProps) {
  const [visible, setVisible] = useState(false);
  const isActive = !staticLabel && selected !== null && selected !== undefined;

  const surfaceColor = useThemeColor({}, 'surface');
  const surfaceMutedColor = useThemeColor({}, 'surfaceMuted');
  const textColor = useThemeColor({}, 'text');
  const textMutedColor = useThemeColor({}, 'textMuted');
  const accentColor = useThemeColor({}, 'accent');
  const accentSoftColor = useThemeColor({}, 'accentSoft');

  return (
    <>
      <Pressable
        disabled={disabled}
        onPress={() => setVisible(true)}
        style={[
          styles.trigger,
          {
            backgroundColor: isActive ? accentSoftColor : surfaceMutedColor,
            opacity: disabled ? 0.5 : 1,
          },
        ]}>
        <ThemedText
          numberOfLines={1}
          style={[Typography.button, styles.triggerText, { color: isActive ? accentColor : textColor }]}>
          {isActive ? (selectedLabel ?? label) : label}
        </ThemedText>
        <IconSymbol name="chevron.down" size={16} color={isActive ? accentColor : textMutedColor} />
      </Pressable>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
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
