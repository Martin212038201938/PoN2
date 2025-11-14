import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

export function formatDate(date: string | Date | undefined, formatStr = 'dd.MM.yyyy'): string {
  if (!date) return '-';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: de });
}

export function formatDateTime(date: string | Date | undefined): string {
  return formatDate(date, 'dd.MM.yyyy HH:mm');
}

export function formatCurrency(amount: number | undefined): string {
  if (amount === undefined || amount === null) return '-';
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export function formatPercentage(value: number | undefined): string {
  if (value === undefined || value === null) return '-';
  return `${value.toFixed(1)}%`;
}
