import type { CategoryId, PeriodDays, Repo } from '../src/types.ts';

export const PERIODS: readonly PeriodDays[] = [30, 90, 180, 365];

/** Minimum total stars per period; keeps results relevant. Tune later. */
export const MIN_STARS: Record<PeriodDays, number> = {
  30: 20,
  90: 50,
  180: 100,
  365: 200,
};

/**
 * Each category is a list of sub-queries appended to the period's base query.
 * Repo search doesn't reliably support OR between topics, so each sub-query is
 * run separately and the results are merged. `''` means "base query only".
 */
export const CATEGORIES: Record<CategoryId, readonly string[]> = {
  skills: [
    'topic:claude-code',
    'topic:claude-skills',
    'topic:agent-skills',
    'topic:mcp-server',
    'topic:mcp',
    '"claude code" in:name,description',
    'skills in:name claude in:description',
  ],
  'ai-tools': [
    'topic:llm',
    'topic:ai-agents',
    'topic:ai-agent',
    'topic:rag',
    'topic:ai-coding',
    'topic:agentic-ai',
  ],
  popular: [''],
};

export const CATEGORY_IDS = Object.keys(CATEGORIES) as CategoryId[];

type RelevanceInput = Pick<Repo, 'fullName' | 'description' | 'topics'>;

const SKILL_TOPICS = new Set([
  'agent-skills',
  'ai-skills',
  'claude-skills',
  'claude-code-skills',
  'claude-code-plugin',
  'skill',
  'skills',
  'mcp-server',
  'mcp-servers',
  'subagents',
]);

const SKILL_TEXT =
  /\b(skills?|mcp[- ]servers?|subagents?|claude\.md|slash commands?|claude code|for (?:ai )?coding agents)\b/i;

/**
 * Optional per-category post-filter. Topics like `mcp` or `claude-code` are often
 * just "built with" tags on unrelated apps (TV launchers, CAD tools, fitness
 * trackers), so `skills` requires a strong topic or an explicit mention.
 */
export const RELEVANCE: Partial<Record<CategoryId, (repo: RelevanceInput) => boolean>> = {
  skills: (repo) =>
    repo.topics.some((t) => SKILL_TOPICS.has(t)) ||
    SKILL_TEXT.test(`${repo.fullName.split('/')[1]} ${repo.description ?? ''}`),
};
