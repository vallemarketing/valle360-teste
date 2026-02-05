'use client';

import React from 'react';
import { Globe } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Locale } from '@/lib/i18n/translations';

const LOCALE_LABELS: Record<Locale, { flag: string; label: string }> = {
  'pt-BR': { flag: '🇧🇷', label: 'Português' },
  'en': { flag: '🇺🇸', label: 'English' },
};

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'buttons' | 'compact';
}

export function LanguageSwitcher({ variant = 'dropdown' }: LanguageSwitcherProps) {
  const { locale, changeLocale, locales } = useTranslation();

  if (variant === 'compact') {
    return (
      <button
        onClick={() => {
          const currentIndex = locales.indexOf(locale);
          const nextIndex = (currentIndex + 1) % locales.length;
          changeLocale(locales[nextIndex]);
        }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
        style={{ color: 'var(--text-secondary)' }}
      >
        <Globe className="w-4 h-4" />
        {LOCALE_LABELS[locale].flag}
      </button>
    );
  }

  if (variant === 'buttons') {
    return (
      <div className="flex items-center gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        {locales.map((loc) => {
          const isActive = loc === locale;
          return (
            <button
              key={loc}
              onClick={() => changeLocale(loc)}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                ${isActive ? 'bg-white shadow-sm' : 'hover:bg-gray-100'}
              `}
              style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
            >
              <span>{LOCALE_LABELS[loc].flag}</span>
              <span className="hidden sm:inline">{LOCALE_LABELS[loc].label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Dropdown variant
  return (
    <div className="relative group">
      <button
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
        style={{ color: 'var(--text-secondary)' }}
      >
        <Globe className="w-4 h-4" />
        <span>{LOCALE_LABELS[locale].flag}</span>
        <span className="hidden sm:inline">{LOCALE_LABELS[locale].label}</span>
      </button>

      <div className="absolute right-0 top-full mt-1 py-1 rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50"
        style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)', minWidth: '150px' }}
      >
        {locales.map((loc) => (
          <button
            key={loc}
            onClick={() => changeLocale(loc)}
            className={`
              w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 transition-colors
              ${loc === locale ? 'font-medium' : ''}
            `}
            style={{ color: loc === locale ? 'var(--primary-600)' : 'var(--text-primary)' }}
          >
            <span>{LOCALE_LABELS[loc].flag}</span>
            <span>{LOCALE_LABELS[loc].label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default LanguageSwitcher;
