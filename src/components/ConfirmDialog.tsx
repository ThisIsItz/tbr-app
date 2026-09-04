import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { registerConfirmHandler, type ConfirmRequest } from '@/lib/confirm';
import { Typography } from '@/lib/theme/theme';

export function ConfirmDialog() {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const surfaceColor = useThemeColor({}, 'surface');
  const surfaceMutedColor = useThemeColor({}, 'surfaceMuted');
  const textColor = useThemeColor({}, 'text');
  const textMutedColor = useThemeColor({}, 'textMuted');
  const dangerColor = useThemeColor({}, 'danger');
  const onDangerColor = useThemeColor({}, 'onAccent');
  const shadowColor = useThemeColor({}, 'shadow');

  useEffect(() => {
    registerConfirmHandler(setRequest);
    return () => registerConfirmHandler(null);
  }, []);

  function respond(value: boolean) {
    request?.resolve(value);
    setRequest(null);
  }

  return (
    <Modal visible={!!request} transparent animationType="fade" onRequestClose={() => respond(false)}>
      <Pressable
        style={styles.backdrop}
        onPress={() => respond(false)}
        accessibilityRole="button"
        accessibilityLabel={request?.cancelLabel ?? ''}>
        {request && (
          <Pressable
            style={[styles.card, { backgroundColor: surfaceColor, boxShadow: `0px 8px 24px ${shadowColor}` }]}
            onPress={(e) => e.stopPropagation()}>
            <ThemedText style={[Typography.sectionTitle, { color: textColor }]}>{request.title}</ThemedText>
            <ThemedText style={[Typography.body, { color: textMutedColor }]}>{request.message}</ThemedText>
            <View style={styles.actions}>
              <Pressable
                onPress={() => respond(false)}
                accessibilityRole="button"
                accessibilityLabel={request.cancelLabel}
                style={[styles.button, { backgroundColor: surfaceMutedColor }]}>
                <ThemedText style={[Typography.button, { color: textColor }]}>{request.cancelLabel}</ThemedText>
              </Pressable>
              <Pressable
                onPress={() => respond(true)}
                accessibilityRole="button"
                accessibilityLabel={request.confirmLabel}
                style={[styles.button, { backgroundColor: dangerColor }]}>
                <ThemedText style={[Typography.button, { color: onDangerColor }]}>
                  {request.confirmLabel}
                </ThemedText>
              </Pressable>
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
    backgroundColor: 'rgba(0,0,0,0.35)',
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
