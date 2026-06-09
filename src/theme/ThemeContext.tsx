import React, { createContext, useCallback, useContext, useState } from 'react';
import AppColors, { ColorTokens } from './Colors';

type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  colors: ColorTokens;
  isDark: boolean;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: AppColors.light, isDark: false, themeMode: 'light',
  toggleTheme: () => {}, setThemeMode: () => {},
});

const STORAGE_KEY = '@idhayam_theme_mode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored === 'dark' ? 'dark' : 'light') as ThemeMode;
  });

  const isDark = themeMode === 'dark';
  const colors = AppColors.getColors(isDark);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeMode(isDark ? 'light' : 'dark');
  }, [isDark, setThemeMode]);

  return (
    <ThemeContext.Provider value={{ colors, isDark, themeMode, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => useContext(ThemeContext);
export default ThemeContext;
