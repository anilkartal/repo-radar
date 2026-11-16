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
    'topic:ai-coding',
    'topic:agentic-ai',
  ],
  // Retrieval-augmented generation: RAG frameworks, vector DBs, knowledge graphs, embeddings, document parsing.
  rag: [
    'topic:rag',
    'topic:retrieval-augmented-generation',
    'topic:graphrag',
    'topic:vector-database',
    'rag in:name',
    'topic:knowledge-graph topic:llm',
    'topic:embeddings',
    'topic:document-parsing',
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
  // Courses, tutorials, from-scratch builds, roadmaps, notebooks, interview prep for AI / LLMs.
  learning: [
    'topic:tutorial topic:llm',
    'topic:course',
    'topic:learning-resources',
    'from-scratch in:name',
    'learn in:name topic:ai',
    'topic:interview topic:llm',
    'topic:jupyter-notebook topic:llm',
    'topic:roadmap topic:ai',
    '"learning path" in:description',
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

// Plain `rag` is left out: apps and courses use it as a "built with" / "covers" tag, so those need a text match.
const RAG_TOPICS = new Set([
  'retrieval-augmented-generation',
  'graphrag',
  'agentic-rag',
  'lightrag',
  'vector-database',
  'vector-search',
  'hybrid-search',
]);
const RAG_TEXT =
  /\brag\b|retriev|vector (db|database|search|index|store)|knowledge (base|graph)|semantic search|embedding|rerank|graphrag|grounding|ingestion|document pars|知识库|检索/i;
// Catches names like `PixelRAG` or `LightningRAG` (but not `RAGE`), which `\brag\b` misses.
const RAG_NAME = /RAG(?!E)/;

const LEARNING_TOPICS = new Set(['tutorial', 'tutorials', 'course', 'learning-resources', 'curriculum']);
// "interview" alone also matches interview-copilot apps, so require prep material.
const LEARNING_TEXT =
  /tutorial|course|curriculum|\blearn|guide|handbook|roadmap|from[- ](zero|scratch)|first principles|lecture|notebooks?\b|playbook|cheat ?sheet|hands-on|beginner|interview (questions|prep)|教程|指南|入门|学习|面试题|面经|讲义|从零|从 ?0/i;
// `topic:course` and `from-scratch in:name` also return non-AI material.
const AI_TEXT = /\bai\b|\bllms?\b|agent|gpt|claude|deepseek|qwen|gemini|llama|machine learning|deep learning|neural|transformer|\brl\b|inference|大模型|智能体/i;
const AI_TOPICS = /^(ai|llm|llms|agents?|ai-agents?|machine-learning|deep-learning|generative-ai|genai|claude.*|openai|rag)$/;

const nameAndDescription = (repo: RelevanceInput) => `${repo.fullName.split('/')[1]} ${repo.description ?? ''}`;

/**
 * Optional per-category post-filter. Topic tags are noisy: `mcp` or `claude-code`
 * alone are often "built with" tags on unrelated apps, and `prompt-engineering`
 * is also used by coding skills, so each category needs a strong topic or an
 * explicit mention in the name/description.
 */
const isLearning = (repo: RelevanceInput) =>
  (repo.topics.some((t) => AI_TOPICS.test(t)) || AI_TEXT.test(nameAndDescription(repo))) &&
  (repo.topics.some((t) => LEARNING_TOPICS.has(t)) || LEARNING_TEXT.test(nameAndDescription(repo)));

export const RELEVANCE: Partial<Record<CategoryId, (repo: RelevanceInput) => boolean>> = {
  // Courses and roadmaps that merely cover RAG belong in `learning`.
  rag: (repo) =>
    !isLearning(repo) && (repo.topics.some((t) => RAG_TOPICS.has(t)) ||
      RAG_TEXT.test(nameAndDescription(repo)) ||
      RAG_NAME.test(nameAndDescription(repo))),
  learning: isLearning,
  skills: (repo) => repo.topics.some((t) => SKILL_TOPICS.has(t)) || SKILL_TEXT.test(nameAndDescription(repo)),
  prompts: (repo) => repo.topics.some((t) => PROMPT_TOPICS.has(t)) || PROMPT_TEXT.test(nameAndDescription(repo)),
  'agent-building': (repo) =>
    repo.topics.some((t) => AGENT_BUILDING_TOPICS.has(t)) || AGENT_BUILDING_TEXT.test(nameAndDescription(repo)),
  'ai-quality': (repo) =>
    !OFFENSIVE_TEXT.test(nameAndDescription(repo)) &&
    (repo.topics.some((t) => QUALITY_TOPICS.has(t)) || QUALITY_TEXT.test(nameAndDescription(repo))),
};
