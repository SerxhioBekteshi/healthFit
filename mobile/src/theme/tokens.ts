export interface Colors {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  accent: string;
  onAccent: string;
  accentSoft: string;
  danger: string;
  dangerSoft: string;
  warning: string;
  warningSoft: string;
  success: string;
  successSoft: string;
  info: string;
  infoSoft: string;
  overlay: string;
}

export const lightColors: Colors = {
  background: '#F4F6F8',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF1F4',
  border: '#E1E5EA',
  text: '#14171C',
  textMuted: '#5B6572',
  textSubtle: '#8A94A1',
  accent: '#2E8B7A',
  onAccent: '#FFFFFF',
  accentSoft: '#E0F2EE',
  danger: '#C0392B',
  dangerSoft: '#FBE9E7',
  warning: '#B7791F',
  warningSoft: '#FDF3DC',
  success: '#2F855A',
  successSoft: '#E3F4EA',
  info: '#2B6CB0',
  infoSoft: '#E4EEF9',
  overlay: 'rgba(10, 12, 16, 0.5)',
};

export const darkColors: Colors = {
  background: '#0E1014',
  surface: '#171A20',
  surfaceMuted: '#1F232B',
  border: '#2A2F39',
  text: '#E8ECF1',
  textMuted: '#A2ABB8',
  textSubtle: '#707A88',
  accent: '#7AB8AA',
  onAccent: '#0E1014',
  accentSoft: '#1E2F2B',
  danger: '#E89494',
  dangerSoft: '#34201F',
  warning: '#DFB870',
  warningSoft: '#33291A',
  success: '#7CCBA0',
  successSoft: '#1B2C24',
  info: '#85B0E0',
  infoSoft: '#1D2837',
  overlay: 'rgba(0, 0, 0, 0.65)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

export type TextVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'body'
  | 'bodyStrong'
  | 'caption'
  | 'label'
  | 'mono';

interface TextStyleToken {
  fontSize: number;
  lineHeight: number;
  fontWeight: '400' | '500' | '600' | '700';
}

export const typography: Record<TextVariant, TextStyleToken> = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '700' },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '700' },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
  mono: { fontSize: 17, lineHeight: 24, fontWeight: '600' },
};
