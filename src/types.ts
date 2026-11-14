export type PeriodDays = 30 | 90 | 180 | 365;
export type CategoryId = 'skills' | 'ai-tools' | 'popular';

export interface LocalizedSummary {
  what: string;
  howToUse: string;
  useCases: string[];
}

export interface RepoSummary {
  tr: LocalizedSummary;
  en: LocalizedSummary;
}

export interface Repo {
  fullName: string;        // "owner/repo"
  url: string;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  license: string | null;
  topics: string[];
  createdAt: string;       // ISO
  pushedAt: string;        // ISO
  summary: RepoSummary | null;
  summarySource: 'readme' | 'description' | null;
}

export interface RepoData {
  generatedAt: string;     // ISO
  repos: Record<string, Repo>;                                  // keyed by fullName
  lists: Record<`${PeriodDays}`, Record<CategoryId, string[]>>;  // ordered fullNames, stars desc
}
