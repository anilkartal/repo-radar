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
  // Prompt libraries, system prompts, prompt-engineering collections.
  prompts: ['topic:prompts', 'topic:system-prompts', 'topic:prompt', 'prompts in:name', 'topic:prompt-engineering'],
  // Frameworks, templates, guides and courses for building agents.
  'agent-building': [
    'topic:agent-framework',
    'topic:ai-agent-framework',
    'topic:agentic-workflow',
    'topic:langgraph',
    'topic:crewai',
    '"build agents" in:description',
    'topic:tutorial topic:llm',
    'guide in:name topic:llm',
  ],
  // Making AI output better and safer: evals, observability, guardrails,
  // context engineering, prompt optimization, LLM security.
  'ai-quality': [
    'topic:llm-evaluation',
    'topic:evals',
    'topic:context-engineering',
    'topic:guardrails',
    'topic:llm-observability',
    'topic:prompt-optimization',
    'topic:hallucination',
    'topic:llm-security',
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

const PROMPT_TOPICS = new Set(['prompts', 'system-prompts', 'prompt', 'prompt-library', 'prompt-templates', 'awesome-prompts']);
const PROMPT_TEXT = /\bprompts?\b|system[- ]prompt|提示词/i;

const AGENT_BUILDING_TEXT =
  /framework|\bsdk\b|build(ing)? (ai )?agent|agent(ic)? (app|system)s?|template|starter|boilerplate|blueprint|guide|tutorial|course|handbook|roadmap|learn|from (zero|scratch)|runtime|harness|教程|指南/i;

const QUALITY_TEXT =
  /eval|benchmark|observab|tracing|traces|guard|safety|secur|sandbox|context engineering|context|hallucinat|quality|reliab|regression|audit|optimi[sz]|monitor|red[- ]team|verif|grounded|fact/i;

// Topics specific enough to trust on their own (unlike e.g. `langgraph` or
// `llm-security`, which also tag unrelated apps and offensive tooling).
const AGENT_BUILDING_TOPICS = new Set(['agent-framework', 'ai-agent-framework', 'agents-sdk', 'agent-sdk']);
// `context-engineering` is left out: coding agents use it loosely, so those repos need a text match.
const QUALITY_TOPICS = new Set(['llm-evaluation', 'evals', 'guardrails', 'llm-observability', 'prompt-optimization', 'hallucination']);
// Offensive tooling (pentest / bug-bounty agents) isn't about making your AI better.
const OFFENSIVE_TEXT = /penetration|pentest|bug[- ]?bount|offensive|exploit/i;

const nameAndDescription = (repo: RelevanceInput) => `${repo.fullName.split('/')[1]} ${repo.description ?? ''}`;

/**
 * Optional per-category post-filter. Topic tags are noisy: `mcp` or `claude-code`
 * alone are often "built with" tags on unrelated apps, and `prompt-engineering`
 * is also used by coding skills, so each category needs a strong topic or an
 * explicit mention in the name/description.
 */
export const RELEVANCE: Partial<Record<CategoryId, (repo: RelevanceInput) => boolean>> = {
  skills: (repo) => repo.topics.some((t) => SKILL_TOPICS.has(t)) || SKILL_TEXT.test(nameAndDescription(repo)),
  prompts: (repo) => repo.topics.some((t) => PROMPT_TOPICS.has(t)) || PROMPT_TEXT.test(nameAndDescription(repo)),
  'agent-building': (repo) =>
    repo.topics.some((t) => AGENT_BUILDING_TOPICS.has(t)) || AGENT_BUILDING_TEXT.test(nameAndDescription(repo)),
  'ai-quality': (repo) =>
    !OFFENSIVE_TEXT.test(nameAndDescription(repo)) &&
    (repo.topics.some((t) => QUALITY_TOPICS.has(t)) || QUALITY_TEXT.test(nameAndDescription(repo))),
};
