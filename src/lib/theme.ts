export const themePresets = [
  { name: 'Verde', primary: '#214e38', accent: '#c69c52', darkPrimary: '#6fb18a', darkAccent: '#e3bf75' },
  { name: 'Olive', primary: '#3f4f24', accent: '#d3a94f', darkPrimary: '#95a86a', darkAccent: '#e6c878' },
  { name: 'Sage', primary: '#6f8f72', accent: '#e7b86a', darkPrimary: '#a9c0a5', darkAccent: '#f0d08d' },
  { name: 'Mint', primary: '#2f7f6f', accent: '#f2c77b', darkPrimary: '#77c5b6', darkAccent: '#f5d794' },
  { name: 'Terra', primary: '#7a3f2a', accent: '#d89b65', darkPrimary: '#bf755d', darkAccent: '#e5b47f' },
  { name: 'Navy', primary: '#243b53', accent: '#d6a85f', darkPrimary: '#6f91b2', darkAccent: '#e5c27b' },
  { name: 'Plum', primary: '#55344f', accent: '#d9a15f', darkPrimary: '#a9789d', darkAccent: '#e6bd7d' },
  { name: 'Charcoal', primary: '#222725', accent: '#bfa46a', darkPrimary: '#7f8a84', darkAccent: '#d6bf82' },
  { name: 'Ivory', primary: '#4f7c5a', accent: '#d8b46a', darkPrimary: '#8fbd96', darkAccent: '#ead18f' },
  { name: 'Pearl', primary: '#5d7f8f', accent: '#d9ad73', darkPrimary: '#93b6c4', darkAccent: '#e9ca98' },
];

export type ThemePreset = (typeof themePresets)[number];

export function resolveThemePreset(primary?: string | null, accent?: string | null) {
  const normalizedPrimary = normalizeHex(primary);
  const normalizedAccent = normalizeHex(accent);

  return (
    themePresets.find((theme) => theme.primary === normalizedPrimary && theme.accent === normalizedAccent) ||
    themePresets.find((theme) => theme.primary === normalizedPrimary) ||
    themePresets.find((theme) => theme.accent === normalizedAccent)
  );
}

export function resolveThemeColors(primary?: string | null, accent?: string | null) {
  const normalizedPrimary = normalizeHex(primary) || themePresets[0].primary;
  const normalizedAccent = normalizeHex(accent) || themePresets[0].accent;
  const preset = resolveThemePreset(normalizedPrimary, normalizedAccent);

  return {
    primary: normalizedPrimary,
    accent: normalizedAccent,
    darkPrimary: preset?.darkPrimary || liftHex(normalizedPrimary, 42),
    darkAccent: preset?.darkAccent || liftHex(normalizedAccent, 26),
  };
}

function normalizeHex(value?: string | null) {
  if (!value) return '';
  const trimmed = value.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(trimmed)) return trimmed;
  if (/^[0-9a-f]{6}$/.test(trimmed)) return `#${trimmed}`;
  return '';
}

function liftHex(hex: string, amount: number) {
  const normalized = normalizeHex(hex);
  if (!normalized) return hex;

  const channels = [1, 3, 5].map((start) => {
    const value = Number.parseInt(normalized.slice(start, start + 2), 16);
    return Math.min(255, value + amount);
  });

  return `#${channels.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}
