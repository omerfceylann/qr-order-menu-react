import type { RestaurantSettings } from './types';

export function formatMoney(value: number, settings?: RestaurantSettings | null) {
  const currency = settings?.currency || 'TRY';

  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function makeTableCode(name: string) {
  const clean = name
    .toLocaleLowerCase('tr-TR')
    .replace(/[^a-z0-9çğıöşü]+/gi, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24);
  return `${clean || 'masa'}-${Math.random().toString(36).slice(2, 7)}`;
}
