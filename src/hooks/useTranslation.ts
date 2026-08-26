import { useContext } from 'react';

import { LanguageContext } from '@/i18n/LanguageProvider';

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
