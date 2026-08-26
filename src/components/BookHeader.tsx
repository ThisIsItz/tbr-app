import { Image, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTranslation } from '@/hooks/useTranslation';
import { Typography } from '@/lib/theme/theme';

interface BookHeaderProps {
  title: string;
  authors: string[];
  coverUrl: string | null;
}

export function BookHeader({ title, authors, coverUrl }: BookHeaderProps) {
  const { t } = useTranslation();
  const surfaceMutedColor = useThemeColor({}, 'surfaceMuted');
  const textColor = useThemeColor({}, 'text');
  const textMutedColor = useThemeColor({}, 'textMuted');

  return (
    <View style={styles.header}>
      {coverUrl ? (
        <Image
          source={{ uri: coverUrl }}
          style={styles.thumbnail}
          resizeMode="cover"
          onError={(e) => console.warn('[BookHeader] cover failed to load:', coverUrl, e.nativeEvent.error)}
        />
      ) : (
        <View style={[styles.thumbnail, styles.thumbnailPlaceholder, { backgroundColor: surfaceMutedColor }]}>
          <ThemedText style={[Typography.caption, { color: textMutedColor }]}>
            {t('bookCard.noCover')}
          </ThemedText>
        </View>
      )}
      <View style={styles.headerText}>
        <ThemedText style={[Typography.screenTitle, { color: textColor }]}>{title}</ThemedText>
        {authors.length > 0 && (
          <ThemedText style={[styles.author, { color: textMutedColor }]}>{authors.join(', ')}</ThemedText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  thumbnail: {
    width: 130,
    height: 195,
    borderRadius: 14,
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  headerText: {
    flex: 1,
    gap: 6,
  },
  author: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '500',
  },
});
