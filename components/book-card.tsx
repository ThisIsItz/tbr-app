import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { PaletteColors } from '@/constants/palette';
import { toHttpsUrl } from '@/lib/google-books';

interface BookCardAction {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

interface BookCardProps {
  title: string;
  author?: string | null;
  genre?: string | null;
  statusLabel?: string | null;
  thumbnailUrl?: string | null;
  onPress?: () => void;
  action?: BookCardAction;
  colors: PaletteColors;
}

export function BookCard({
  title,
  author,
  genre,
  statusLabel,
  thumbnailUrl,
  onPress,
  action,
  colors,
}: BookCardProps) {
  const coverUrl = toHttpsUrl(thumbnailUrl);

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          shadowColor: colors.shadow,
        },
      ]}>
      {coverUrl ? (
        <Image source={{ uri: coverUrl }} style={styles.cover} contentFit="cover" />
      ) : (
        <View style={[styles.cover, styles.coverPlaceholder, { backgroundColor: colors.surfaceMuted }]}>
          <ThemedText style={{ color: colors.textMuted, fontSize: 11 }}>No cover</ThemedText>
        </View>
      )}

      <View style={styles.body}>
        <ThemedText
          numberOfLines={2}
          style={[styles.title, { color: colors.textPrimary }]}>
          {title}
        </ThemedText>

        {!!author && (
          <ThemedText numberOfLines={1} style={[styles.author, { color: colors.textMuted }]}>
            {author}
          </ThemedText>
        )}

        <View style={styles.tagRow}>
          {!!genre && (
            <View style={[styles.tag, { backgroundColor: colors.accentSoft }]}>
              <ThemedText numberOfLines={1} style={[styles.tagText, { color: colors.accent }]}>
                {genre}
              </ThemedText>
            </View>
          )}
          {!!statusLabel && (
            <View style={[styles.tag, { backgroundColor: colors.surfaceMuted }]}>
              <ThemedText numberOfLines={1} style={[styles.tagText, { color: colors.textMuted }]}>
                {statusLabel}
              </ThemedText>
            </View>
          )}
        </View>

        {action && (
          <Pressable
            onPress={action.onPress}
            disabled={action.disabled}
            style={[
              styles.actionButton,
              { backgroundColor: action.disabled ? colors.surfaceMuted : colors.accent },
            ]}>
            <ThemedText
              style={[styles.actionText, { color: action.disabled ? colors.textMuted : '#fff' }]}>
              {action.label}
            </ThemedText>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 10,
    gap: 12,
    width: '100%',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  cover: {
    width: 60,
    height: 90,
    borderRadius: 8,
  },
  coverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  author: {
    fontSize: 13,
    lineHeight: 18,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  tag: {
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
    maxWidth: '100%',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButton: {
    marginTop: 8,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
