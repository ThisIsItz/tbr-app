import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Typography } from '@/lib/theme/theme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTranslation } from '@/hooks/useTranslation';
import { searchGoogleBooksByIsbn } from '@/api/googleBooks';

const FRAME_WIDTH = 260;
const FRAME_HEIGHT = 160;

export default function ScanIsbnScreen() {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const [isLocked, setIsLocked] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const surfaceColor = useThemeColor({}, 'surface');
  const shadowColor = useThemeColor({}, 'shadow');
  const textColor = useThemeColor({}, 'text');
  const textMutedColor = useThemeColor({}, 'textMuted');
  const accentColor = useThemeColor({}, 'accent');

  async function handleBarcodeScanned(result: BarcodeScanningResult) {
    setIsLocked(true);
    setNotFound(false);
    setIsSearching(true);

    try {
      const volume = await searchGoogleBooksByIsbn(result.data);
      if (volume) {
        router.replace(`/add/${volume.id}`);
        return;
      }
      setNotFound(true);
    } catch {
      setNotFound(true);
    } finally {
      setIsSearching(false);
    }
  }

  function handleScanAgain() {
    setNotFound(false);
    setIsLocked(false);
  }

  if (!permission) {
    return <View style={[styles.centered, { backgroundColor }]} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.centered, styles.permissionContainer, { backgroundColor }]}>
        <ThemedText style={[Typography.sectionTitle, styles.centeredText, { color: textColor }]}>
          {t('scanIsbn.permissionTitle')}
        </ThemedText>
        <ThemedText style={[Typography.body, styles.centeredText, { color: textMutedColor }]}>
          {t('scanIsbn.permissionBody')}
        </ThemedText>
        <Pressable
          style={[styles.primaryButton, { backgroundColor: accentColor }]}
          onPress={() => (permission.canAskAgain ? requestPermission() : Linking.openSettings())}>
          <ThemedText style={[Typography.button, { color: '#fff' }]}>
            {permission.canAskAgain ? t('scanIsbn.grantPermission') : t('scanIsbn.openSettings')}
          </ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['ean13'] }}
        onBarcodeScanned={isLocked ? undefined : handleBarcodeScanned}
      />

      <View style={styles.maskContainer}>
        <View style={styles.maskDark} />

        <View style={styles.maskMiddleRow}>
          <View style={styles.maskDark} />
          <View style={styles.scanFrame} />
          <View style={styles.maskDark} />
        </View>

        <View style={[styles.maskDark, styles.bottomContent]}>
          <ThemedText style={[Typography.body, styles.centeredText, { color: '#fff' }]}>
            {t('scanIsbn.instructions')}
          </ThemedText>

          {isSearching && (
            <View style={[styles.statusCard, { backgroundColor: surfaceColor, shadowColor }]}>
              <ActivityIndicator color={accentColor} />
              <ThemedText style={[Typography.body, { color: textColor }]}>
                {t('scanIsbn.searching')}
              </ThemedText>
            </View>
          )}

          {notFound && (
            <View style={[styles.statusCard, { backgroundColor: surfaceColor, shadowColor }]}>
              <ThemedText style={[Typography.bookTitle, styles.centeredText, { color: textColor }]}>
                {t('scanIsbn.notFoundTitle')}
              </ThemedText>
              <ThemedText style={[Typography.body, styles.centeredText, { color: textMutedColor }]}>
                {t('scanIsbn.notFoundBody')}
              </ThemedText>
              <Pressable
                style={[styles.primaryButton, { backgroundColor: accentColor }]}
                onPress={handleScanAgain}>
                <ThemedText style={[Typography.button, { color: '#fff' }]}>
                  {t('scanIsbn.scanAgain')}
                </ThemedText>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centeredText: {
    textAlign: 'center',
  },
  permissionContainer: {
    padding: 24,
    gap: 12,
  },
  maskContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  maskDark: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  maskMiddleRow: {
    flexDirection: 'row',
    height: FRAME_HEIGHT,
  },
  scanFrame: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    borderWidth: 3,
    borderColor: '#fff',
  },
  bottomContent: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 24,
    paddingHorizontal: 24,
    gap: 16,
  },
  statusCard: {
    width: '100%',
    borderRadius: 14,
    padding: 16,
    gap: 8,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  primaryButton: {
    borderRadius: 10,
    paddingHorizontal: 20,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
