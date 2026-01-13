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

export function formatCurrency(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null) return '-';
  const numValue = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numValue)) return '-';
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(numValue);
}

export function formatPercentage(value: number | string | undefined | null): string {
  if (value === undefined || value === null) return '-';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '-';
  return `${numValue.toFixed(1)}%`;
}
