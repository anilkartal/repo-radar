# Product Spec — Repo Radar

## Goal
Help a developer quickly discover new, popular and useful GitHub repos in the AI space: see what each repo does and how to start using it, without opening dozens of READMEs.

## Core concept
- **Period** = repos *created* within the last 30 / 90 / 180 / 365 days.
- **Ranking** = total stargazer count, descending.
- Note: this is "most popular new repos", not "stars gained in the period". Star-growth ranking is a possible v2 feature (see ROADMAP).

## Categories
| id | TR label | EN label | Content |
|---|---|---|---|
| `skills` | Claude & AI Skills | Claude & AI Skills | Claude Code skills, agent skills, MCP servers, subagents, prompt/command libraries |
| `ai-tools` | AI Araçları | AI Tools | LLM apps, agent frameworks, AI coding tools, RAG, inference/tooling |
| `prompts` | Promptlar | Prompts | Prompt libraries, system prompts, prompt-engineering collections |
| `agent-building` | Ajan Geliştirme | Agent Building | Frameworks, templates, guides and courses for building agents |
| `ai-quality` | AI Kalitesi | AI Quality | Evals, observability, guardrails, context engineering, prompt optimization, LLM security |
| `popular` | Genel Popüler | Trending Overall | Any repo, no topic filter |

A repo may appear in several categories (e.g. an MCP server is both `skills` and `popular`). Query config lives in `scripts/categories.ts` — see DATA-PIPELINE.md.

## Data per repo
- full name (owner/repo), URL, GitHub description
- total stars, forks, primary language, license, topics
- created date, last pushed date
- summary in TR and EN:
  - `what` — 1–2 sentences: what problem it solves
  - `howToUse` — 2–4 short steps or a short paragraph: install/usage starting point (e.g. `npx ...`, `pip install ...`, "copy into `~/.claude/skills`")
  - `useCases` — up to 3 short bullets

## Pages & UI
Single page app, no routing needed for MVP (state may be mirrored in the URL query string: `?period=90&cat=skills&q=mcp&lang=en`).

**Header**: site name, last-updated date (from `generatedAt`), TR/EN toggle.

**Controls**
- Period tabs: `1 Ay / 3 Ay / 6 Ay / 1 Yıl` ↔ `1M / 3M / 6M / 1Y`. Default: 3 months.
- Category chips (single select). Default: `skills`.
- Search box: filters by name, description, topics and summary text (client-side, case-insensitive).
- Optional language filter dropdown (built from data).

**List**: ranked cards, rank number shown (#1, #2…), 50 per period×category.

**RepoCard**
- rank, `owner/repo` (link opens GitHub in a new tab), stars (formatted `12.3k`), language, created date (relative: "3 hafta önce" / "3 weeks ago")
- `what` text, collapsible "Nasıl kullanılır? / How to use" section with `howToUse` (render inline code), `useCases` bullets
- topics as small tags (max 5)
- If summary is missing, fall back to GitHub description with a subtle "summary pending" note.

**States**: loading skeleton, empty result ("No repos match"), data load error.

**Design**: clean, dark-mode-first with light mode support (`prefers-color-scheme`), responsive (1 column mobile, 2 columns ≥1024px). Accessible: keyboard-navigable tabs/chips, visible focus, contrast AA.

## Language
- UI language toggle persists in `localStorage` (wrap in try/catch), default from `navigator.language` (`tr*` → TR, else EN).
- Summaries in TR keep technical terms in English (skill, agent, MCP server, CLI, prompt…).

## Out of scope (MVP)
Accounts, favorites synced to a server, comments, star-history charts, automated refresh, tests.

## Acceptance criteria
1. `npm run fetch` produces `public/data/repos.json` matching the schema, 4 periods × 6 categories, ≤50 repos each, sorted by stars desc.
2. Second `npm run fetch` run within the same day makes zero (or near-zero) LLM calls thanks to the cache.
3. Switching period/category/language/search updates the list instantly with no network request after first load.
4. Every visible user-facing string exists in both `tr.ts` and `en.ts`.
5. Lighthouse: Performance ≥ 90, Accessibility ≥ 95 on the production build.
