# Data Pipeline

Runs locally via `npm run fetch` (`tsx scripts/fetch.ts`). Output: `public/data/repos.json` + `public/data/summary-cache.json`, both committed.

## Flow
```
for period in [30, 90, 180, 365]:
  for category in categories:
    run category queries (GitHub Search API) -> merge -> dedupe -> sort by stars -> top 50
collect unique repos across all lists
for each unique repo:
  if cache hit (same full_name + same readme sha): reuse summary
  else: fetch README -> summarize with Claude -> validate -> store in cache
write repos.json (lists reference repos by full_name; repo details stored once)
print report: query count, repos, cache hits, LLM calls, tokens, est. cost
```

## 1. GitHub search
Endpoint: `GET /search/repositories` via Octokit `search.repos`.

Base query per period:
```
created:>=YYYY-MM-DD stars:>=MIN_STARS fork:false archived:false
```
- `YYYY-MM-DD` = today minus N days (UTC).
- `MIN_STARS`: 30d → 20, 90d → 50, 180d → 100, 365d → 200 (keeps results relevant, tune later).
- `sort=stars`, `order=desc`, `per_page=100`, single page.

Repo search does **not** reliably support `OR` between topics, so each category is a list of sub-queries; run each, merge, dedupe by `full_name`, re-sort by stars, take top 50.

`scripts/categories.ts` (starting point, tune freely):
```ts
export const CATEGORIES = {
  skills: [
    'topic:claude-code', 'topic:claude-skills', 'topic:agent-skills',
    'topic:mcp-server', 'topic:model-context-protocol', 'topic:mcp',
    '"claude code" in:name,description', 'skills in:name claude in:description',
  ],
  'ai-tools': [
    'topic:llm', 'topic:ai-agents', 'topic:ai-agent', 'topic:generative-ai',
    'topic:rag', 'topic:ai-coding', 'topic:llmops', 'topic:agentic-ai',
  ],
  popular: [''], // base query only
} as const;
```
The live config in `scripts/categories.ts` adds `rag`, `prompts`, `agent-building`, `ai-quality` and `learning` (see SPEC.md) with their own sub-queries and relevance filters; `topic:rag` moved from `ai-tools` to `rag`, and courses that merely cover RAG go to `learning`. Query count ≈ 4 periods × 51 sub-queries = ~204 requests → throttle at 1 req / 2.5s (~10 min). Retry on 403/429 honoring `retry-after` or `x-ratelimit-reset`, max 3 retries.

Relevance filter (implemented): `skills` keeps a repo only if it has a strong topic (`agent-skills`, `claude-skills`, `skill(s)`, `mcp-server`, …) or its name/description mentions skills, MCP servers, subagents, `CLAUDE.md` or Claude Code. Topics like `mcp` / `claude-code` alone are often "built with" tags on unrelated apps. Configured as `RELEVANCE` in `scripts/categories.ts`; `--dry-run` prints what each list filtered out plus per-sub-query contribution.

Clone filter (implemented): if 3+ repos from different owners share the same name and description in one list, all of them are dropped as a spam / star-farm network (e.g. 61 copies of `GitHub-Copilot-app`). The run log prints each dropped group.

The empty-description-and-no-topics spam filter was tried and dropped: it removed legit repos from big orgs (e.g. `anthropics/*`, `openai/*`).

## 2. README fetch
`GET /repos/{owner}/{repo}/readme` (Octokit `repos.getReadme`). Keep `sha` for cache key, decode base64 content.
- Strip HTML tags, badges/images lines, and long tables; truncate to ~12,000 chars.
- No README → summarize from description + topics only; set `summarySource: "description"`.
- README fetches use the core API (5,000 req/h), no extra throttling needed beyond small concurrency (e.g. 4 parallel).

## 3. Summarization (Gemini or Anthropic)
- Provider via `SUMMARY_PROVIDER`:
  - `gemini` (default in `.env.example`, free tier): OpenAI-compatible endpoint `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`, called with plain `fetch` (no extra dependency). JSON enforced with `response_format: {type: "json_schema"}`. Free-tier limits are low and per project, so requests are spaced by `SUMMARY_MIN_INTERVAL_MS` (default 4000) with `SUMMARY_CONCURRENCY` (default 1); 429/5xx are retried with `retry-after` / backoff, and a 429 that persists (daily quota) stops the run cleanly — summaries so far stay in the cache, re-run the next day to continue.
  - `anthropic`: `claude-haiku-5-5` with forced tool use as described below.
- Model via `SUMMARY_MODEL` (required for Gemini: a Flash model available to your key).
- One call per repo returns both languages. Anthropic: force JSON via tool use (single tool `save_summary` with the schema below as `input_schema`, `tool_choice: {type:"tool", name:"save_summary"}`).
- Concurrency 3 for Anthropic (1 for Gemini), retry on 429/529 with backoff.
- Account, quota or config errors (401/403/404, persistent 429, or a 400 before any success) stop the run without touching `repos.json`.
- Validate with zod plus content checks (no CJK characters outside backticks; a Turkish summary may only say "Türkçe" if the source is Turkish, since "Chinese guide" → "Türkçe rehber" was a real failure); on failure retry once, then skip and leave summary `null`.

Prompt guidelines (system):
- You summarize GitHub repos for developers.
- `what`: 1–2 sentences, concrete, no marketing language.
- `howToUse`: shortest real path to first use (install command, config location, CLI invocation). Use backticks for commands. Do not invent commands not present in the README; if unclear, say how to start from the README.
- `useCases`: max 3, ≤ 10 words each.
- Turkish output keeps technical terms in English.

## 4. Cache
`public/data/summary-cache.json`:
```json
{ "owner/repo": { "readmeSha": "abc123", "model": "claude-haiku-5-5", "summarizedAt": "2026-11-14T10:00:00Z", "summary": { ... } } }
```
Cache hit = same `full_name` and same `readmeSha`. Flag `--force-summaries` ignores the cache. Never delete entries automatically (repos may come back).

## 5. Output schema (`src/types.ts`)
```ts
export type PeriodDays = 30 | 90 | 180 | 365;
export type CategoryId = 'skills' | 'ai-tools' | 'rag' | 'prompts' | 'agent-building' | 'ai-quality' | 'learning' | 'popular';

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
```

## 6. CLI flags
- `--dry-run` — GitHub only, no README/LLM, print per-list counts and top 5.
- `--force-summaries` — ignore cache.
- `--resummarize a/b,c/d` — re-summarize only these repos, even if cached (fix a bad summary).
- `--limit N` — cap per list (default 50), useful for testing.

## Env
```
GITHUB_TOKEN=         # fine-grained token, public repo read access is enough
SUMMARY_PROVIDER=gemini      # gemini | anthropic
GEMINI_API_KEY=              # free key from Google AI Studio
ANTHROPIC_API_KEY=           # only for SUMMARY_PROVIDER=anthropic
SUMMARY_MODEL=               # e.g. a Gemini Flash model, or claude-haiku-5-5
# Optional tuning: SUMMARY_CONCURRENCY, SUMMARY_MIN_INTERVAL_MS, SUMMARY_REASONING_EFFORT
```
