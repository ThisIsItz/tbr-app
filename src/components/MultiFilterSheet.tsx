import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/IconSymbol';
import { Typography } from '@/constants/theme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTranslation } from '@/hooks/useTranslation';

interface MultiFilterSheetProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  disabled?: boolean;
}

// Multi-select counterpart to FilterSheet, used for genre.
export function MultiFilterSheet({ label, options, selected, onChange, disabled }: MultiFilterSheetProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const isActive = selected.length > 0;

  const surfaceColor = useThemeColor({}, 'surface');
  const surfaceMutedColor = useThemeColor({}, 'surfaceMuted');
  const textColor = useThemeColor({}, 'text');
  const textMutedColor = useThemeColor({}, 'textMuted');
  const accentColor = useThemeColor({}, 'accent');
  const accentSoftColor = useThemeColor({}, 'accentSoft');

  const triggerLabel =
    selected.length === 0 ? label : selected.length === 1 ? selected[0] : `${label} (${selected.length})`;

  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }

  return (
    <>
      <Pressable
        disabled={disabled}
        onPress={() => setVisible(true)}
        style={[
          styles.trigger,
          { backgroundColor: isActive ? accentSoftColor : surfaceMutedColor, opacity: disabled ? 0.5 : 1 },
        ]}>
        <ThemedText
          numberOfLines={1}
          style={[Typography.button, styles.triggerText, { color: isActive ? accentColor : textColor }]}>
          {triggerLabel}
        </ThemedText>
        <IconSymbol name="chevron.down" size={16} color={isActive ? accentColor : textMutedColor} />
      </Pressable>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: surfaceColor }]}
            onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <ThemedText style={[Typography.sectionTitle, { color: textColor }]}>{label}</ThemedText>
              {selected.length > 0 && (
                <Pressable onPress={() => onChange([])} hitSlop={8}>
                  <ThemedText style={[Typography.button, { color: accentColor }]}>
                    {t('common.clear')}
                  </ThemedText>
                </Pressable>
              )}
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              style={styles.optionList}
              renderItem={({ item }) => {
                const isSelected = selected.includes(item);
                return (
                  <Pressable onPress={() => toggle(item)} style={styles.optionRow}>
                    <ThemedText
                      style={[
                        Typography.body,
                        { color: isSelected ? accentColor : textColor, fontWeight: isSelected ? '700' : '400' },
                      ]}>
                      {item}
                    </ThemedText>
                    <IconSymbol
                      name={isSelected ? 'checkmark.circle.fill' : 'circle'}
                      size={20}
                      color={isSelected ? accentColor : textMutedColor}
                    />
                  </Pressable>
                );
              }}
            />
            <Pressable
              onPress={() => setVisible(false)}
              style={[styles.doneButton, { backgroundColor: accentColor }]}>
              <ThemedText style={[Typography.button, { color: '#fff' }]}>{t('common.done')}</ThemedText>
            </Pressable>
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
    gap: 12,
    maxHeight: '70%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  doneButton: {
    borderRadius: 10,
    paddingVertical: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
