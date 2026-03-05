import { useCallback } from 'react';
import { type AppCurrency, type AppLocale, usePreferencesStore } from '../store/preferencesStore.ts';

const toSafeDate = (value: Date | string): Date => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

interface CurrencyOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

interface CompactCurrencyOptions {
  maximumFractionDigits?: number;
}

export function useFormatting() {
  const locale = usePreferencesStore((s) => s.locale);
  const currency = usePreferencesStore((s) => s.currency);

  const formatCurrency = useCallback(
    (value: number, options: CurrencyOptions = {}): string => {
      const { minimumFractionDigits = 0, maximumFractionDigits = minimumFractionDigits } = options;
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits,
        maximumFractionDigits,
      }).format(value);
    },
    [locale, currency]
  );

  const formatCurrencyCompact = useCallback(
    (value: number, options: CompactCurrencyOptions = {}): string =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        notation: 'compact',
        maximumFractionDigits: options.maximumFractionDigits ?? 1,
      }).format(value),
    [locale, currency]
  );

  const formatDate = useCallback(
    (value: Date | string, options?: Intl.DateTimeFormatOptions): string =>
      new Intl.DateTimeFormat(locale, options).format(toSafeDate(value)),
    [locale]
  );

  const formatMonthLabel = useCallback(
    (
      monthKey: string,
      options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' }
    ): string => {
      const [year, month] = monthKey.split('-').map(Number);
      if (!year || !month) return monthKey;
      const formatted = new Intl.DateTimeFormat(locale, options).format(new Date(year, month - 1, 1));
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    },
    [locale]
  );

  return {
    locale,
    currency,
    formatCurrency,
    formatCurrencyCompact,
    formatDate,
    formatMonthLabel,
  };
}

export const formatCurrencyFromSettings = (
  value: number,
  locale: AppLocale,
  currency: AppCurrency,
  options: CurrencyOptions = {}
): string => {
  const { minimumFractionDigits = 0, maximumFractionDigits = minimumFractionDigits } = options;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
};

export const formatDateFromSettings = (
  value: Date | string,
  locale: AppLocale,
  options?: Intl.DateTimeFormatOptions
): string =>
  new Intl.DateTimeFormat(locale, options).format(toSafeDate(value));
