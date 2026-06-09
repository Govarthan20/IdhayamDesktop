export const BrandColors = {
  primaryGradientStart: '#7B61FF',
  primaryGradientEnd: '#FD79A8',
  verifyGradientStart: '#27AE60',
  verifyGradientEnd: '#2FCCB0',
  idhayamRed: '#E3001B',
  idhayamYellow: '#F5C800',
  white: '#FFFFFF',
  black: '#000000',
  grey50: '#F5F7FB',
  grey100: '#EBEEF2',
  grey200: '#E0E5ED',
  grey300: '#CBD3E1',
  grey400: '#94A3B8',
  grey500: '#64748B',
  grey600: '#475569',
  grey700: '#334155',
  grey800: '#1E293B',
  grey900: '#1F1F39',
  overlayLight: 'rgba(123, 97, 255, 0.08)',
  overlayDark: 'rgba(0, 0, 0, 0.4)',
  transparent: 'transparent',
} as const;

export type ColorTokens = {
  background: string; backgroundSecondary: string; surface: string;
  glassBackground: string; glassBorder: string; glassShadow: string;
  textPrimary: string; textSecondary: string; textMuted: string;
  textOnPrimary: string; textOnAccent: string; textLink: string;
  inputBackground: string; inputBorder: string; inputFocusBorder: string;
  inputPlaceholder: string; inputText: string;
  buttonPrimary: string; buttonPrimaryText: string; buttonSecondary: string;
  buttonSecondaryText: string; buttonPrimaryGradientStart: string;
  buttonPrimaryGradientEnd: string; buttonVerifyGradientStart: string;
  buttonVerifyGradientEnd: string;
  iconPrimary: string; iconSecondary: string;
  success: string; error: string; warning: string;
  gradientColors: string[];
  toggleThumbOn: string; toggleTrackOn: string; divider: string;
};

export const LightColors: ColorTokens = {
  background: BrandColors.white, backgroundSecondary: BrandColors.grey50, surface: BrandColors.white,
  glassBackground: 'rgba(255,255,255,0.95)', glassBorder: '#F1F4FF', glassShadow: 'rgba(123,97,255,0.15)',
  textPrimary: BrandColors.grey900, textSecondary: '#858597', textMuted: '#BDBDBD',
  textOnPrimary: BrandColors.white, textOnAccent: BrandColors.grey900, textLink: '#6C5CE7',
  inputBackground: '#F5F5FA', inputBorder: '#F0F0F5', inputFocusBorder: '#7B61FF',
  inputPlaceholder: '#BDBDBD', inputText: BrandColors.grey900,
  buttonPrimary: '#7B61FF', buttonPrimaryText: BrandColors.white,
  buttonSecondary: BrandColors.transparent, buttonSecondaryText: '#7B61FF',
  buttonPrimaryGradientStart: BrandColors.primaryGradientStart, buttonPrimaryGradientEnd: BrandColors.primaryGradientEnd,
  buttonVerifyGradientStart: BrandColors.verifyGradientStart, buttonVerifyGradientEnd: BrandColors.verifyGradientEnd,
  iconPrimary: '#7B61FF', iconSecondary: '#FD79A8',
  success: '#27AE60', error: '#FF4D4D', warning: '#F5C800',
  gradientColors: [BrandColors.white, BrandColors.grey50, BrandColors.white],
  toggleThumbOn: '#7B61FF', toggleTrackOn: '#E8E4FF', divider: '#F0F0F5',
};

export const DarkColors: ColorTokens = {
  background: BrandColors.grey900, backgroundSecondary: BrandColors.grey800, surface: BrandColors.grey800,
  glassBackground: 'rgba(31,31,57,0.85)', glassBorder: 'rgba(255,255,255,0.1)', glassShadow: 'rgba(0,0,0,0.5)',
  textPrimary: BrandColors.white, textSecondary: BrandColors.grey300, textMuted: BrandColors.grey500,
  textOnPrimary: BrandColors.white, textOnAccent: BrandColors.grey900, textLink: '#A29BFE',
  inputBackground: BrandColors.grey800, inputBorder: BrandColors.grey700, inputFocusBorder: '#7B61FF',
  inputPlaceholder: BrandColors.grey500, inputText: BrandColors.white,
  buttonPrimary: '#7B61FF', buttonPrimaryText: BrandColors.white,
  buttonSecondary: BrandColors.transparent, buttonSecondaryText: '#A29BFE',
  buttonPrimaryGradientStart: BrandColors.primaryGradientStart, buttonPrimaryGradientEnd: BrandColors.primaryGradientEnd,
  buttonVerifyGradientStart: BrandColors.verifyGradientStart, buttonVerifyGradientEnd: BrandColors.verifyGradientEnd,
  iconPrimary: '#A29BFE', iconSecondary: '#FD79A8',
  success: '#27AE60', error: '#FF6B6B', warning: '#F5C800',
  gradientColors: [BrandColors.grey900, '#25254B', '#1F1F39'],
  toggleThumbOn: '#7B61FF', toggleTrackOn: BrandColors.grey700, divider: 'rgba(255,255,255,0.08)',
};

export const AppColors = {
  brand: BrandColors,
  light: LightColors,
  dark: DarkColors,
  getColors: (isDark: boolean): ColorTokens => (isDark ? DarkColors : LightColors),
};

export default AppColors;
