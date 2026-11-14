import type { Messages } from './messages';

export const en: Messages = {
  appName: 'Repo Radar',
  tagline: 'The most-starred new GitHub repos in AI, with a short summary of what each one does and how to start.',
  lastUpdated: (date) => `Last updated ${date}`,

  langToggleLabel: 'Language',
  langName: { tr: 'Türkçe', en: 'English' },

  periodTabsLabel: 'Created within',
  period: { 30: '1M', 90: '3M', 180: '6M', 365: '1Y' },
  periodLong: { 30: 'Last month', 90: 'Last 3 months', 180: 'Last 6 months', 365: 'Last year' },

  categoryChipsLabel: 'Category',
  category: { skills: 'Claude & AI Skills', 'ai-tools': 'AI Tools', popular: 'Trending Overall' },

  searchLabel: 'Search repos',
  searchPlaceholder: 'Search by name, description, topic…',
  languageFilterLabel: 'Programming language',
  allLanguages: 'All languages',

  resultCount: (count) => (count === 1 ? '1 repo' : `${count} repos`),
  rank: (n) => `#${n}`,
  stars: (formatted) => `${formatted} stars`,
  starsLabel: 'Stars',
  createdLabel: 'Created',
  openOnGitHub: (fullName) => `Open ${fullName} on GitHub`,
  howToUse: 'How to use',
  useCases: 'Use cases',
  topicsLabel: 'Topics',
  summaryPending: 'Summary pending, showing the GitHub description.',

  loading: 'Loading repos…',
  emptyTitle: 'No repos match',
  emptyHint: 'Try another search, period or category.',
  errorTitle: "Couldn't load the repo list",
  errorHint: 'Check your connection and try again.',
  retry: 'Try again',
};
