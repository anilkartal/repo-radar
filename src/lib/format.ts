import type { Lang } from '@/i18n/messages';

const LOCALE: Record<Lang, string> = { tr: 'tr-TR', en: 'en-US' };

// Intl constructors are slow; build each formatter once per language.
function memo<T>(make: (lang: Lang) => T): (lang: Lang) => T {
  const cache = new Map<Lang, T>();
  return (lang) => {
    let value = cache.get(lang);
    if (!value) {
      value = make(lang);
      cache.set(lang, value);
    }
    return value;
  };
}

const oneDecimal = memo((lang) => new Intl.NumberFormat(LOCALE[lang], { maximumFractionDigits: 1 }));
const noDecimal = memo((lang) => new Intl.NumberFormat(LOCALE[lang], { maximumFractionDigits: 0 }));
const integer = memo((lang) => new Intl.NumberFormat(LOCALE[lang]));
const relative = memo((lang) => new Intl.RelativeTimeFormat(LOCALE[lang], { numeric: 'auto' }));
const mediumDate = memo((lang) => new Intl.DateTimeFormat(LOCALE[lang], { dateStyle: 'medium' }));

/** 980 → "980", 12345 → "12.3k" (en) / "12,3k" (tr), 1_250_000 → "1.3M". */
export function formatStars(n: number, lang: Lang): string {
  if (n < 1000) return String(n);
  const [value, suffix] = n < 1_000_000 ? [n / 1000, 'k'] : [n / 1_000_000, 'M'];
  return `${(value < 100 ? oneDecimal : noDecimal)(lang).format(value)}${suffix}`;
}

/** 459280 → "459,280" (en) / "459.280" (tr). */
export function formatInteger(n: number, lang: Lang): string {
  return integer(lang).format(n);
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365],
  ['month', 30],
  ['week', 7],
  ['day', 1],
];

/** "3 weeks ago" / "3 hafta önce". */
export function formatRelative(iso: string, lang: Lang, now: Date = new Date()): string {
  const days = (new Date(iso).getTime() - now.getTime()) / 86_400_000;
  const rtf = relative(lang);
  for (const [unit, size] of UNITS) {
    // Switch to years a bit early so ~11.5+ months reads "last year", not "12 months ago".
    const threshold = unit === 'year' ? 345 : size;
    if (Math.abs(days) >= threshold || unit === 'day') return rtf.format(Math.round(days / size), unit);
  }
  return rtf.format(0, 'day');
}

export function formatDate(iso: string, lang: Lang): string {
  return mediumDate(lang).format(new Date(iso));
}
