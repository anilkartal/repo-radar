# Repo Radar

The most-starred GitHub repos **created within** the last 1 / 3 / 6 / 12 months in the AI space, grouped by category, each with a short bilingual (Turkish / English) summary of what it does and how to start using it.

**Live site:** https://anilkartal.github.io/repo-radar/

- **Categories:** Claude & AI Skills (skills, MCP servers, plugins) · AI Tools (LLM apps, RAG, AI coding) · Prompts (prompt libraries, system prompts) · Agent Building (frameworks, templates, guides) · AI Quality (evals, observability, guardrails, context engineering) · Trending Overall
- **Ranking:** total stars, descending; top 50 per period × category
- **Summaries:** "what it does", "how to use" (real commands from the README) and up to 3 use cases, in TR and EN
- **UI:** search, language filter, shareable URLs (`?period=90&cat=skills&q=mcp&lang=en`), dark/light themes, keyboard accessible

It's a static site: data is fetched and summarized locally with `npm run fetch`, committed as JSON, and the browser only reads `/data/repos.json`.

## How it works

```
GitHub Search API ──► scripts/fetch.ts ──► README fetch + cleanup ──► LLM summary (TR + EN)
   (4 periods ×           (merge, dedupe,        (badges/HTML stripped,       (Gemini free tier
    sub-queries)           relevance filter,      ≤12k chars)                   or Anthropic; zod-validated,
                           top 50 by stars)                                     cached by README sha)
                                   │
                                   ▼
                public/data/repos.json  ──►  Vite + React SPA  ──►  GitHub Pages
```

Summaries are cached in `public/data/summary-cache.json`, keyed by README sha, so a refresh only summarizes new or changed repos.

## Setup

Requires Node 20+.

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

| Variable | Needed for | Where to get it |
|---|---|---|
| `GITHUB_TOKEN` | `npm run fetch` | GitHub → Settings → Developer settings → fine-grained token with public-repo read access |
| `SUMMARY_PROVIDER` | `npm run fetch` | `gemini` (free tier, default) or `anthropic` |
| `GEMINI_API_KEY` | provider `gemini` | [Google AI Studio](https://aistudio.google.com/apikey) |
| `ANTHROPIC_API_KEY` | provider `anthropic` | [Claude Console](https://console.anthropic.com/) |
| `SUMMARY_MODEL` | `npm run fetch` | e.g. `gemini-3.5-flash-lite` or `claude-haiku-5-5` |

Optional tuning: `SUMMARY_CONCURRENCY`, `SUMMARY_MIN_INTERVAL_MS`, `SUMMARY_REASONING_EFFORT` (see `.env.example`). `.env` is git-ignored; never commit it.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server at http://localhost:5173 |
| `npm run build` | Typecheck + production build to `dist/` |
| `npm run lint` | ESLint + `tsc --noEmit` |
| `npm run fetch -- --dry-run` | GitHub queries only: per-list counts, top 10, what each sub-query contributes, what the relevance filter dropped |
| `npm run fetch` | Full refresh: search, READMEs, summaries, writes `public/data/` |
| `npm run fetch -- --limit 3` | Same, capped at 3 repos per list (quick test) |
| `npm run fetch -- --force-summaries` | Re-summarize everything, ignoring the cache |
| `npm run fetch -- --resummarize owner/repo,owner2/repo2` | Re-summarize only these repos (fix a bad summary) |
| `npm run deploy` | Build and publish `dist/` to the `gh-pages` branch |

## Refreshing the data

```bash
npm run fetch -- --dry-run   # sanity-check the lists first
npm run fetch                # ~5 min with a warm cache; ~30 min from scratch on the Gemini free tier
git add public/data && git commit -m "Refresh data"
git push
npm run deploy
```

**Gemini free tier:** about 500 requests per day **per model** (observed for `gemini-3.5-flash-lite` on 2026-11-15; check your limits in AI Studio). A normal refresh only needs a few dozen calls, but a from-scratch run (~740 repos) needs more: either let it stop and re-run the next day, or finish today with another model, e.g. `SUMMARY_MODEL=gemini-3.5-flash npm run fetch` (separate quota, slower).

The end-of-run report shows search requests, cache hits, LLM calls, tokens and estimated cost. If the provider returns an account, quota or config error (bad key, no credits, daily free-tier quota), the run stops without touching `repos.json`; summaries made so far stay in the cache, so re-running later continues where it left off.

## Project layout

```
scripts/            data pipeline (runs locally, never bundled)
  fetch.ts          entry point and end-of-run report
  github.ts         throttled search with rate-limit retries, README fetch + cleanup
  categories.ts     periods, star thresholds, sub-queries, relevance filter
  summarize.ts      Gemini / Anthropic providers, prompt, zod schema
  cache.ts          summary cache
  deploy-pages.sh   gh-pages publish
src/
  components/       PeriodTabs, CategoryChips, SearchBox, LanguageFilter, LangToggle, RepoCard, status views
  i18n/             tr.ts, en.ts (typed: a missing translation is a compile error), useLang
  lib/              data loading, filtering, URL state, formatting
  types.ts          data schema shared by the UI and the scripts
public/data/        repos.json, summary-cache.json (generated, committed)
docs/               SPEC.md, DATA-PIPELINE.md, ROADMAP.md
```

More detail: [docs/SPEC.md](docs/SPEC.md) (product scope), [docs/DATA-PIPELINE.md](docs/DATA-PIPELINE.md) (queries, summarization, cache, schema), [docs/ROADMAP.md](docs/ROADMAP.md) (build steps and v2 ideas).

## Notes

- "Most popular **new** repos" ranks by total stars among repos created in the period, not stars gained during it. Star-growth ranking is a v2 idea.
- Summaries are LLM-generated from each repo's README and can be wrong; the GitHub link is always one click away.

---

## Türkçe özet

Repo Radar, AI alanında son 1 / 3 / 6 / 12 ay içinde **oluşturulmuş** ve en çok yıldız alan GitHub repo'larını kategorilere göre listeler. Her repo için "ne işe yarar", "nasıl kullanılır" ve kullanım alanlarını Türkçe ve İngilizce özetler.

- **Canlı site:** https://anilkartal.github.io/repo-radar/
- **Kurulum:** `npm install`, ardından `.env.example` dosyasını `.env` olarak kopyalayıp anahtarları doldurun (yukarıdaki tablo).
- **Veriyi yenileme:** `npm run fetch`, sonra `public/data` değişikliklerini commit edip `npm run deploy`.
- Özetler varsayılan olarak Gemini'nin ücretsiz katmanıyla üretilir; cache sayesinde sadece yeni veya README'si değişen repo'lar yeniden özetlenir.
