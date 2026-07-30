// Warm, book-focused palette for the Library and Search screens.
// Kept separate from `Colors` (constants/theme.ts) so the rest of the app
// (tab bar, book detail, add flow) is unaffected until it's redesigned too.

export interface PaletteColors {
  background: string;
  surface: string;
  surfaceMuted: string;
  textPrimary: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  border: string;
  shadow: string;
}

export const Palette: { light: PaletteColors; dark: PaletteColors } = {
  light: {
    background: '#FAF3EA',
    surface: '#FFFFFF',
    surfaceMuted: '#F1E7DA',
    textPrimary: '#2B2018',
    textMuted: '#8A7969',
    accent: '#B2492A',
    accentSoft: '#F3DCCB',
    border: '#ECE0D2',
    shadow: 'rgba(43, 32, 24, 0.10)',
  },
  dark: {
    background: '#1E1712',
    surface: '#2A2019',
    surfaceMuted: '#33281F',
    textPrimary: '#F3E9DC',
    textMuted: '#B0A08D',
    accent: '#E08A5B',
    accentSoft: '#4A2E1D',
    border: '#3B2E23',
    shadow: 'rgba(0, 0, 0, 0.4)',
  },
};
