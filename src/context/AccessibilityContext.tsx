import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ContrastMode = 'normal' | 'high';
export type TextSizeMode = 'normal' | 'large';

interface AccessibilityContextType {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
  contrast: ContrastMode;
  setContrast: (contrast: ContrastMode) => void;
  textSize: TextSizeMode;
  setTextSize: (size: TextSizeMode) => void;
  reducedMotion: boolean;
  setReducedMotion: (enabled: boolean) => void;
  announce: (message: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const THEME_KEY = 'mykanban_theme_pref';
const CONTRAST_KEY = 'mykanban_contrast_pref';
const TEXT_SIZE_KEY = 'mykanban_textsize_pref';
const MOTION_KEY = 'mykanban_motion_pref';

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem(THEME_KEY) as ThemeMode) || 'light';
  });

  const [contrast, setContrastState] = useState<ContrastMode>(() => {
    return (localStorage.getItem(CONTRAST_KEY) as ContrastMode) || 'normal';
  });

  const [textSize, setTextSizeState] = useState<TextSizeMode>(() => {
    return (localStorage.getItem(TEXT_SIZE_KEY) as TextSizeMode) || 'normal';
  });

  const [reducedMotion, setReducedMotionState] = useState<boolean>(() => {
    const saved = localStorage.getItem(MOTION_KEY);
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>('');

  // Handle System Theme detection
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateTheme = () => {
      if (theme === 'system') {
        setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
      } else {
        setResolvedTheme(theme);
      }
    };

    updateTheme();
    mediaQuery.addEventListener('change', updateTheme);
    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [theme]);

  // Apply classes to document.documentElement
  useEffect(() => {
    const root = document.documentElement;

    // Theme class
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }

    // High Contrast
    if (contrast === 'high') {
      root.classList.add('high-contrast');
      root.setAttribute('data-contrast', 'high');
    } else {
      root.classList.remove('high-contrast');
      root.removeAttribute('data-contrast');
    }

    // Text Size
    if (textSize === 'large') {
      root.classList.add('text-large');
      root.setAttribute('data-text-size', 'large');
    } else {
      root.classList.remove('text-large');
      root.removeAttribute('data-text-size');
    }

    // Reduced Motion
    if (reducedMotion) {
      root.classList.add('reduce-motion');
      root.setAttribute('data-reduce-motion', 'true');
    } else {
      root.classList.remove('reduce-motion');
      root.removeAttribute('data-reduce-motion');
    }
  }, [resolvedTheme, contrast, textSize, reducedMotion]);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
  }, []);

  const setContrast = useCallback((newContrast: ContrastMode) => {
    setContrastState(newContrast);
    localStorage.setItem(CONTRAST_KEY, newContrast);
  }, []);

  const setTextSize = useCallback((newSize: TextSizeMode) => {
    setTextSizeState(newSize);
    localStorage.setItem(TEXT_SIZE_KEY, newSize);
  }, []);

  const setReducedMotion = useCallback((enabled: boolean) => {
    setReducedMotionState(enabled);
    localStorage.setItem(MOTION_KEY, String(enabled));
  }, []);

  const announce = useCallback((message: string) => {
    setLiveAnnouncement(message);
    setTimeout(() => {
      setLiveAnnouncement('');
    }, 4000);
  }, []);

  return (
    <AccessibilityContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        contrast,
        setContrast,
        textSize,
        setTextSize,
        reducedMotion,
        setReducedMotion,
        announce,
      }}
    >
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="a11y-live-region"
      >
        {liveAnnouncement}
      </div>
      {children}
    </AccessibilityContext.Provider>
  );
};

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
