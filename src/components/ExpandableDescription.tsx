import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { IconSymbol } from '@/components/IconSymbol';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTranslation } from '@/hooks/useTranslation';
import { Typography } from '@/lib/theme/theme';

const COLLAPSED_LINES = 6;
const FADE_BARS = 6;

interface ExpandableDescriptionProps {
  description: string;
}

export function ExpandableDescription({ description }: ExpandableDescriptionProps) {
  const { t } = useTranslation();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textMutedColor = useThemeColor({}, 'textMuted');
  const accentColor = useThemeColor({}, 'accent');
  const [isExpanded, setExpanded] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  return (
    <View style={styles.section}>
      <ThemedText style={[Typography.sectionTitle, { color: textColor }]}>
        {t('bookDetail.description')}
      </ThemedText>
      <View>
        <ThemedText
          style={[Typography.body, { color: textMutedColor }]}
          numberOfLines={isExpanded ? undefined : COLLAPSED_LINES}
          onTextLayout={(e) => {
            if (!isExpanded) {
              setHasMore(e.nativeEvent.lines.length >= COLLAPSED_LINES);
            }
          }}>
          {description}
        </ThemedText>
        {!isExpanded && hasMore && (
          <View style={styles.fade} pointerEvents="none">
            {Array.from({ length: FADE_BARS }).map((_, i) => (
              <View
                key={i}
                style={[styles.fadeBar, { backgroundColor, opacity: (i + 1) / FADE_BARS }]}
              />
            ))}
          </View>
        )}
      </View>
      {hasMore && (
        <Pressable
          onPress={() => setExpanded((v) => !v)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={isExpanded ? t('bookDetail.showLess') : t('bookDetail.showMore')}
          style={styles.expandButton}>
          <ThemedText style={[Typography.button, { color: accentColor }]}>
            {isExpanded ? t('bookDetail.showLess') : t('bookDetail.showMore')}
          </ThemedText>
          <IconSymbol name={isExpanded ? 'chevron.up' : 'chevron.down'} size={16} color={accentColor} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 8,
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 32,
    flexDirection: 'column',
  },
  fadeBar: {
    flex: 1,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    alignSelf: 'flex-start',
    marginTop: -6,
  },
});
