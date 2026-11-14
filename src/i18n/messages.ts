import type { CategoryId, PeriodDays } from '@/types';

export type Lang = 'tr' | 'en';

/**
 * Every user-facing string. `tr.ts` and `en.ts` must both satisfy this type, so a
 * missing translation is a compile error. Strings with values are functions.
 */
export interface Messages {
  appName: string;
  tagline: string;
  lastUpdated: (date: string) => string;

  langToggleLabel: string;
  langName: Record<Lang, string>;

  periodTabsLabel: string;
  period: Record<PeriodDays, string>;
  periodLong: Record<PeriodDays, string>;

  categoryChipsLabel: string;
  category: Record<CategoryId, string>;

  searchLabel: string;
  searchPlaceholder: string;
  languageFilterLabel: string;
  allLanguages: string;

  resultCount: (count: number) => string;
  rank: (n: number) => string;
  stars: (formatted: string) => string;
  starsLabel: string;
  createdLabel: string;
  openOnGitHub: (fullName: string) => string;
  howToUse: string;
  useCases: string;
  topicsLabel: string;
  summaryPending: string;

  loading: string;
  emptyTitle: string;
  emptyHint: string;
  errorTitle: string;
  errorHint: string;
  retry: string;
}
