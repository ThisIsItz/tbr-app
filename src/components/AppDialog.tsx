import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { registerDialogHandler, type DialogButton, type DialogRequest } from '@/lib/dialog';
import { Typography } from '@/lib/theme/theme';

interface ButtonColors {
  surfaceMuted: string;
  text: string;
  danger: string;
  accent: string;
  onAccent: string;
}

function buttonColors(style: DialogButton['style'], colors: ButtonColors) {
  if (style === 'destructive') return { background: colors.danger, text: colors.onAccent };
  if (style === 'cancel') return { background: colors.surfaceMuted, text: colors.text };
  return { background: colors.accent, text: colors.onAccent };
}

export function AppDialog() {
  const [request, setRequest] = useState<DialogRequest | null>(null);
  const surfaceColor = useThemeColor({}, 'surface');
  const surfaceMutedColor = useThemeColor({}, 'surfaceMuted');
  const textColor = useThemeColor({}, 'text');
  const textMutedColor = useThemeColor({}, 'textMuted');
  const dangerColor = useThemeColor({}, 'danger');
  const accentColor = useThemeColor({}, 'accent');
  const onAccentColor = useThemeColor({}, 'onAccent');
  const shadowColor = useThemeColor({}, 'shadow');

  useEffect(() => {
    registerDialogHandler(setRequest);
    return () => registerDialogHandler(null);
  }, []);

  function handlePress(button: DialogButton) {
    button.onPress?.();
    setRequest(null);
  }

  function dismiss() {
    const cancelButton = request?.buttons.find((b) => b.style === 'cancel');
    if (cancelButton) handlePress(cancelButton);
    else setRequest(null);
  }

  return (
    <Modal visible={!!request} transparent animationType="fade" onRequestClose={dismiss}>
      <Pressable
        style={styles.backdrop}
        onPress={dismiss}
        accessibilityRole="button"
        accessibilityLabel={request?.buttons.find((b) => b.style === 'cancel')?.text ?? ''}>
        {request && (
          <Pressable
            style={[styles.card, { backgroundColor: surfaceColor, boxShadow: `0px 8px 24px ${shadowColor}` }]}
            onPress={(e) => e.stopPropagation()}>
            <ThemedText style={[Typography.sectionTitle, { color: textColor }]}>{request.title}</ThemedText>
            {request.message && (
              <ThemedText style={[Typography.body, { color: textMutedColor }]}>{request.message}</ThemedText>
            )}
            <View style={styles.actions}>
              {request.buttons.map((button) => {
                const colors = buttonColors(button.style, {
                  surfaceMuted: surfaceMutedColor,
                  text: textColor,
                  danger: dangerColor,
                  accent: accentColor,
                  onAccent: onAccentColor,
                });
                return (
                  <Pressable
                    key={button.text}
                    onPress={() => handlePress(button)}
                    accessibilityRole="button"
                    accessibilityLabel={button.text}
                    style={[styles.button, { backgroundColor: colors.background }]}>
                    <ThemedText style={[Typography.button, { color: colors.text }]}>{button.text}</ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        )}
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
