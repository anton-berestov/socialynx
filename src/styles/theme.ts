export const colors = {
  primary: '#5E4AE3',
  primaryLight: '#7B65E8',
  primaryDark: '#4835C1',
  secondary: '#FF6584',
  secondaryLight: '#FF8AA0',
  background: '#F7F8FA',
  text: '#1F1F1F',
  muted: '#6B7280',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  cardBorder: '#E5E7EB',
  white: '#FFFFFF'
};

type TypographyKey = 'title' | 'subtitle' | 'body' | 'caption';

type Typography = Record<TypographyKey, { fontSize: number; fontWeight: '400' | '500' | '600' | '700' }>
export const typography: Typography = {
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: '400' },
  caption: { fontSize: 12, fontWeight: '400' }
};

export const spacing = {
  xs: 6,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32
};
