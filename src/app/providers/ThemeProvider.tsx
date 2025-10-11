import React, { createContext, useEffect, useMemo, useContext } from 'react';
import { colorPalette, flattenColorPalette } from '@/app/theme/colors';

interface ThemeContextType {
  colors: Record<string, string>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  const value = useMemo(() => ({ colors: flattenColorPalette(colorPalette) }), []);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
