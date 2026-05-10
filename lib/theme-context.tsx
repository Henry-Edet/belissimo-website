// lib/theme-context.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'System' | 'Light' | 'Dark';

export const THEMES = {
  // Light — bright, clean, cream white
  Light: {
    bg:           '#FFF8F9',
    card:         '#FFFFFF',
    text:         '#3B1C1A',
    subText:      '#9D7A7D',
    border:       '#F0E6E8',
    tabBg:        '#9D7A7D',
    tabActive:    '#FFF8F9',
    tabInactive:  '#E8D8D0',
    primary:      '#9D7A7D',
    primaryText:  '#FFFFFF',
    inputBg:      '#FFF8F9',
  },
  // System — medium warm brown, Bellissimo signature
  System: {
    bg:           '#EDE0DB',
    card:         '#F7EFE9',
    text:         '#2E1210',
    subText:      '#7C5E60',
    border:       '#D4BEB8',
    tabBg:        '#7C5E60',
    tabActive:    '#FFF8F9',
    tabInactive:  '#D4BEB8',
    primary:      '#7C5E60',
    primaryText:  '#FFFFFF',
    inputBg:      '#EDE0DB',
  },
  // Dark — deep dark brown, not black
  Dark: {
    bg:           '#1E0E0F',
    card:         '#2E1A1B',
    text:         '#F5E6E8',
    subText:      '#B89FA1',
    border:       '#3D2223',
    tabBg:        '#1E0E0F',
    tabActive:    '#F5E6E8',
    tabInactive:  '#7C5E60',
    primary:      '#C9A8A5',
    primaryText:  '#1E0E0F',
    inputBg:      '#2E1A1B',
  },
};

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  colors: typeof THEMES.Light;
  language: string;
  setLanguage: (l: string) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'System',
  setMode: () => {},
  colors: THEMES.System,
  language: 'English',
  setLanguage: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('System');
  const [language, setLanguageState] = useState('English');

  useEffect(() => {
    (async () => {
      try {
        const savedMode = await AsyncStorage.getItem('bellissimo_theme');
        const savedLang = await AsyncStorage.getItem('bellissimo_language');
        if (savedMode) setModeState(savedMode as ThemeMode);
        if (savedLang) setLanguageState(savedLang);
      } catch {}
    })();
  }, []);

  const setMode = async (m: ThemeMode) => {
    setModeState(m);
    try { await AsyncStorage.setItem('bellissimo_theme', m); } catch {}
    if (m === 'System') Appearance.setColorScheme(null);
    else Appearance.setColorScheme(m.toLowerCase() as 'light' | 'dark');
  };

  const setLanguage = async (l: string) => {
    setLanguageState(l);
    try { await AsyncStorage.setItem('bellissimo_language', l); } catch {}
  };

  const colors = THEMES[mode];

  return (
    <ThemeContext.Provider value={{ mode, setMode, colors, language, setLanguage }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}