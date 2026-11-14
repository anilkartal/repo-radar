# Roadmap

Work top to bottom. Each step should end with a working state; tick the box when done.

## Phase 1 — Scaffold
- [x] 1. `npm create vite@latest . -- --template react-ts`, set TS `strict`, add Tailwind, ESLint, path alias `@/` → `src/`.
- [x] 2. Add `src/types.ts` exactly as in DATA-PIPELINE.md §5. Make `scripts/` able to import it (separate `tsconfig.scripts.json` if needed).
- [x] 3. Add `.env.example`, `.gitignore` (`.env`, `node_modules`, `dist`), npm scripts from CLAUDE.md.
- [x] 4. Create a small hand-written `public/data/repos.json` fixture (2–3 repos) so UI work can start before the pipeline.

## Phase 2 — Data pipeline
- [x] 5. `scripts/github.ts`: Octokit client, throttled search, retry logic. Implement `--dry-run` and verify list counts for all 12 lists.
- [x] 6. `scripts/categories.ts`: tune sub-queries by eyeballing dry-run output; remove noisy queries.
- [x] 7. README fetch + cleanup/truncation.
- [x] 8. `scripts/summarize.ts`: tool-use JSON, zod validation, concurrency, retry. Test with `--limit 3`.
- [x] 9. `scripts/cache.ts` + wire everything in `fetch.ts`; end-of-run report with tokens and est. cost.
- [x] 10. Full run, commit `repos.json` and `summary-cache.json`. Run again and confirm ~0 LLM calls.

## Phase 3 — UI
- [x] 11. i18n: `tr.ts`, `en.ts`, `useLang` hook (localStorage + navigator.language fallback).
- [x] 12. Data loading hook with loading/error states.
- [x] 13. PeriodTabs, CategoryChips, SearchBox, LangToggle; sync state to URL query string.
- [x] 14. RepoCard with collapsible "how to use", inline-code rendering, relative dates, star formatting.
- [x] 15. Empty / error / skeleton states, dark/light, responsive grid.
- [x] 16. Accessibility pass (keyboard, focus, aria on tabs) and Lighthouse check on `npm run build && npx vite preview`.

## Phase 4 — Ship
- [x] 17. Pick a static host (GitHub Pages / Netlify / Vercel / Cloudflare Pages) and deploy `dist/`.
- [ ] 18. README.md for the project: what it is, how to refresh data, env setup.

## Later (v2 ideas)
- Star growth ranking: daily snapshot of star counts (`data/snapshots/YYYY-MM-DD.json`) → "stars gained in period" tab. Alternatively GH Archive via BigQuery.
- GitHub Actions cron to automate `npm run fetch`.
- Vitest for filtering/sorting + Playwright E2E for tab/filter flows.
- More categories (e.g. testing/QA automation), favorites in localStorage, RSS feed of new entries.
