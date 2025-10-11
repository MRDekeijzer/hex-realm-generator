import React, { createContext, useState, useEffect, useMemo, useContext } from 'react';
import { colorTokenList } from '@/features/realm/config/constants';

interface ThemeContextType {
  colors: Record<string, string>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [resolvedColors, setResolvedColors] = useState<Record<string, string>>({});

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');

    const rootStyle = getComputedStyle(document.documentElement);
    const newColors: Record<string, string> = {};
    for (const token of colorTokenList) {
      newColors[token] = rootStyle.getPropertyValue(token).trim();
    }
    setResolvedColors(newColors);
  }, []);

  const value = useMemo(() => ({ colors: resolvedColors }), [resolvedColors]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
