# Repo Radar

A bilingual (TR/EN) static website that lists the most-starred GitHub repos **created within** the last 1 / 3 / 6 / 12 months, grouped by category, sorted by total stars (desc), each with an LLM-generated "what it does / how to use it" summary.

Read these before non-trivial work:
- `docs/SPEC.md` — product scope, UI behavior, acceptance criteria
- `docs/DATA-PIPELINE.md` — GitHub queries, README summarization, cache, JSON schema
- `docs/ROADMAP.md` — ordered build steps; work through them in order and tick them off

## Stack
- Vite + React 18 + TypeScript (strict), Tailwind CSS
- Data fetch script: Node 20+, `tsx`, `@octokit/rest`, `@anthropic-ai/sdk`, `dotenv`, `zod`
- Summaries: provider chosen by `SUMMARY_PROVIDER` — `gemini` (free tier, default in `.env.example`, called via plain `fetch` on its OpenAI-compatible endpoint) or `anthropic`
- No backend. No tests for now (MVP). No CI/cron: data is refreshed manually via `npm run fetch`.

## Commands
- `npm run dev` — Vite dev server
- `npm run build` — typecheck + production build to `dist/`
- `npm run fetch` — pull repos from GitHub, summarize new READMEs, write `public/data/repos.json`
- `npm run fetch -- --dry-run` — run GitHub queries only, skip LLM calls, print counts
- `npm run lint` — ESLint + `tsc --noEmit`

## Layout
```
scripts/          # data pipeline (runs locally only, never bundled)
  fetch.ts        # entry point
  github.ts       # search + README fetch
  summarize.ts    # LLM summaries (Gemini or Anthropic provider)
  categories.ts   # category -> topic query config
  cache.ts        # summary cache read/write
src/
  components/     # RepoCard, PeriodTabs, CategoryChips, SearchBox, LangToggle
  i18n/           # tr.ts, en.ts, useLang hook
  lib/            # data loading, filtering, formatting
  types.ts        # shared types (also imported by scripts/)
public/data/
  repos.json      # generated, committed
  summary-cache.json  # generated, committed (avoids re-summarizing)
```

## Rules
- `src/types.ts` is the single source of truth for the data schema; the fetch script and UI both import from it. Validate LLM output with zod before writing.
- Never call GitHub or any LLM API from browser code. The SPA only reads `/data/repos.json`.
- Secrets live in `.env` (`GITHUB_TOKEN`, `GEMINI_API_KEY` or `ANTHROPIC_API_KEY`). Never commit `.env`; keep `.env.example` updated.
- Respect GitHub Search API limit (30 req/min authenticated): throttle to ~1 req / 2.5s and retry on 403/429 using `retry-after` / `x-ratelimit-reset`.
- Only summarize repos missing from the cache or whose README sha changed. Print token usage and a rough cost at the end of each run.
- UI strings go through `src/i18n`; no hard-coded user-facing text in components.
- Keep components small and typed; no `any`. Prefer plain React state over adding a state library.
- Don't add dependencies beyond the stack above without asking.

## Done means
`npm run build` and `npm run lint` pass with zero errors, and the change is checked in the browser via `npm run dev`.
