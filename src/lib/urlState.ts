import { useEffect, useState } from 'react';
import type { CategoryId, PeriodDays } from '@/types';

export const PERIODS: readonly PeriodDays[] = [30, 90, 180, 365];
export const CATEGORIES: readonly CategoryId[] = ['skills', 'ai-tools', 'prompts', 'agent-building', 'ai-quality', 'popular'];

export interface ViewState {
  period: PeriodDays;
  category: CategoryId;
  query: string;
  language: string;
}

export const DEFAULT_VIEW: ViewState = { period: 90, category: 'skills', query: '', language: '' };

export function parseView(search: string): ViewState {
  const params = new URLSearchParams(search);
  const period = Number(params.get('period'));
  const category = params.get('cat');
  return {
    period: PERIODS.includes(period as PeriodDays) ? (period as PeriodDays) : DEFAULT_VIEW.period,
    category: CATEGORIES.includes(category as CategoryId) ? (category as CategoryId) : DEFAULT_VIEW.category,
    query: params.get('q') ?? '',
    language: params.get('language') ?? '',
  };
}

/** Set or delete query params in place (replaceState), leaving other params alone. */
export function updateSearchParams(changes: Record<string, string | null>): void {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(changes)) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  if (url.href !== window.location.href) window.history.replaceState(null, '', url);
}

/** View state mirrored to the URL; defaults are left out to keep links short. */
export function useViewState(): [ViewState, (patch: Partial<ViewState>) => void] {
  const [view, setView] = useState<ViewState>(() => parseView(window.location.search));

  useEffect(() => {
    updateSearchParams({
      period: view.period === DEFAULT_VIEW.period ? null : String(view.period),
      cat: view.category === DEFAULT_VIEW.category ? null : view.category,
      q: view.query.trim() || null,
      language: view.language || null,
    });
  }, [view]);

  const update = (patch: Partial<ViewState>) => setView((prev) => ({ ...prev, ...patch }));
  return [view, update];
}
