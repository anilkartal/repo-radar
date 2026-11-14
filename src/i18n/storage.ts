import type { Lang } from './messages';

const STORAGE_KEY = 'repo-radar:lang';

export function isLang(value: unknown): value is Lang {
  return value === 'tr' || value === 'en';
}

/** `?lang=` in the URL, else saved choice, else browser language (`tr*` → TR, else EN). */
export function initialLang(): Lang {
  if (typeof window !== 'undefined') {
    const fromUrl = new URLSearchParams(window.location.search).get('lang');
    if (isLang(fromUrl)) return fromUrl;
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLang(saved)) return saved;
  } catch {
    // Storage can throw (private mode, blocked site data); fall through.
  }
  const browser = typeof navigator === 'undefined' ? '' : navigator.language;
  return browser.toLowerCase().startsWith('tr') ? 'tr' : 'en';
}

export function saveLang(lang: Lang): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Non-critical: the choice just won't persist.
  }
}
