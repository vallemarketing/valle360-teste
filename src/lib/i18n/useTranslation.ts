'use client';

import { useCallback, useEffect, useState } from 'react';
import { translations, Locale, TranslationKeys } from './translations';

const DEFAULT_LOCALE: Locale = 'pt-BR';

/**
 * Get nested translation value by dot notation path
 */
function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((current, key) => current?.[key], obj) || path;
}

/**
 * Hook for translations
 */
export function useTranslation() {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    // Check browser language
    const browserLang = typeof navigator !== 'undefined' ? navigator.language : 'pt-BR';
    const detectedLocale = browserLang.startsWith('en') ? 'en' : 'pt-BR';
    
    // Check localStorage
    const storedLocale = typeof localStorage !== 'undefined' 
      ? localStorage.getItem('locale') as Locale 
      : null;
    
    setLocale(storedLocale || detectedLocale);
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let value = getNestedValue(translations[locale], key);
    
    // Fallback to default locale
    if (value === key) {
      value = getNestedValue(translations[DEFAULT_LOCALE], key);
    }
    
    // Replace params
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        value = value.replace(`{{${paramKey}}}`, String(paramValue));
      });
    }
    
    return value;
  }, [locale]);

  const changeLocale = useCallback((newLocale: Locale) => {
    setLocale(newLocale);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('locale', newLocale);
    }
  }, []);

  return {
    t,
    locale,
    changeLocale,
    locales: Object.keys(translations) as Locale[],
  };
}

/**
 * Simple translation function (for server components or outside React)
 */
export function translate(key: string, locale: Locale = 'pt-BR'): string {
  return getNestedValue(translations[locale], key);
}
