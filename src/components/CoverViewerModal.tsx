import { Image } from 'expo-image';
import { X } from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTranslation } from '@/hooks/useTranslation';

interface CoverViewerModalProps {
  visible: boolean;
  coverUrl: string | null;
  onClose: () => void;
}

export function CoverViewerModal({ visible, coverUrl, onClose }: CoverViewerModalProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  if (!coverUrl) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable
          onPress={onClose}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          style={[styles.closeButton, { top: insets.top + 12 }]}>
          <X size={22} color="#FFFFFF" strokeWidth={2} />
        </Pressable>
        <Image source={{ uri: coverUrl }} style={styles.cover} contentFit="contain" />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 1,
  },
  cover: {
    width: '100%',
    height: '80%',
  },
});
