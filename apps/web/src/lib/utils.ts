import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFaNumber(value: number | string, maximumFractionDigits = 1) {
  const number = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(number)) return String(value);
  return new Intl.NumberFormat('fa-IR', { maximumFractionDigits }).format(number);
}

export function formatFaDate(value: string | Date, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  }).format(new Date(value));
}

export function dateFromApiValue(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 12);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function dateToApiValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayApiValue() {
  return dateToApiValue(new Date());
}

export function percent(value: number, total: number) {
  return total === 0 ? 0 : Math.round((value / total) * 100);
}
