import { useContext } from 'react';

import { ThemeContext } from '@/lib/theme/AppThemeProvider';

export function useAppColorScheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppColorScheme must be used within an AppThemeProvider');
  }
  return context;
}
