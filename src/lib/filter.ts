import type { CategoryId, PeriodDays, Repo, RepoData } from '@/types';

/** Repos of one list, in list order (stars desc). */
export function getList(data: RepoData, period: PeriodDays, category: CategoryId): Repo[] {
  // `?? []` keeps older data files (without newer categories) from crashing the UI.
  return (data.lists[`${period}`]?.[category] ?? []).map((name) => data.repos[name]).filter((r): r is Repo => !!r);
}

/**
 * Lowercase and neutralize Turkish dotted/dotless i so "LINUX" matches "linux"
 * and "istanbul" matches "İstanbul" regardless of locale.
 */
export function fold(text: string): string {
  return text.toLowerCase().replace(/̇/g, '').replace(/ı/g, 'i');
}

function haystack(repo: Repo): string {
  const parts = [repo.fullName, repo.description ?? '', ...repo.topics];
  if (repo.summary) {
    for (const s of [repo.summary.en, repo.summary.tr]) parts.push(s.what, s.howToUse, ...s.useCases);
  }
  return fold(parts.join('\n'));
}

export interface Filters {
  query: string;
  /** Programming language, or '' for all. */
  language: string;
}

export function filterRepos(repos: Repo[], { query, language }: Filters): Repo[] {
  const terms = fold(query).split(/\s+/).filter(Boolean);
  return repos.filter(
    (repo) =>
      (!language || repo.language === language) && (terms.length === 0 || terms.every((term) => haystack(repo).includes(term))),
  );
}

/** Languages present in a list, most common first. */
export function languagesOf(repos: Repo[]): string[] {
  const counts = new Map<string, number>();
  for (const r of repos) if (r.language) counts.set(r.language, (counts.get(r.language) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([lang]) => lang);
}
