import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTranslation } from '@/hooks/useTranslation';
import { getLanguageName } from '@/lib/languageNames';
import { Typography } from '@/lib/theme/theme';

function formatPublishedDate(raw: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) return raw;
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

function DetailRow({ label, value, isFirst }: { label: string; value: string; isFirst: boolean }) {
  const textColor = useThemeColor({}, 'text');
  const textMutedColor = useThemeColor({}, 'textMuted');
  const borderColor = useThemeColor({}, 'border');

  return (
    <View
      style={[
        styles.detailRow,
        !isFirst && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: borderColor },
      ]}>
      <ThemedText style={[Typography.metadata, { color: textMutedColor }]}>{label}</ThemedText>
      <ThemedText style={[Typography.body, { color: textColor }]}>{value}</ThemedText>
    </View>
  );
}

interface BookDetailsSectionProps {
  pageCount: number | null;
  language: string | null;
  publisher: string | null;
  publishedDate: string | null;
}

export function BookDetailsSection({ pageCount, language, publisher, publishedDate }: BookDetailsSectionProps) {
  const { t } = useTranslation();
  const textColor = useThemeColor({}, 'text');
  const surfaceColor = useThemeColor({}, 'surface');

  const rows = [
    pageCount != null && {
      label: t('bookDetail.pages'),
      value: t(pageCount === 1 ? 'bookDetail.onePage' : 'bookDetail.pagesCount', { count: pageCount }),
    },
    language && { label: t('bookDetail.language'), value: getLanguageName(language) },
    publisher && { label: t('bookDetail.publisher'), value: publisher },
    publishedDate && { label: t('bookDetail.published'), value: formatPublishedDate(publishedDate) },
  ].filter((row): row is { label: string; value: string } => !!row);

  if (rows.length === 0) return null;

  return (
    <View style={styles.section}>
      <ThemedText style={[Typography.sectionTitle, { color: textColor }]}>
        {t('bookDetail.details')}
      </ThemedText>
      <View style={[styles.detailsCard, { backgroundColor: surfaceColor }]}>
        {rows.map((row, index) => (
          <DetailRow key={row.label} label={row.label} value={row.value} isFirst={index === 0} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 8,
  },
  detailsCard: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: 16,
  },
});
