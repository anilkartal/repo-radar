// Entry point for `npm run fetch`: GitHub search → README fetch → summarize
// (cached) → public/data/repos.json. See docs/DATA-PIPELINE.md.
import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import type { Octokit } from '@octokit/rest';
import type { CategoryId, PeriodDays, Repo, RepoData } from '../src/types.ts';
import { getCached, inputSha, loadCache, saveCache, setCached } from './cache.ts';
import { CATEGORIES, CATEGORY_IDS, PERIODS, RELEVANCE } from './categories.ts';
import { buildQuery, createClient, fetchReadme, searchRepos, stats, type Readme, type SearchRepo } from './github.ts';
import { mapLimit } from './pool.ts';
import { createSummarizer, SummaryApiError, summaryStats, type Summarizer } from './summarize.ts';

const REPOS_PATH = 'public/data/repos.json';
const CACHE_PATH = 'public/data/summary-cache.json';
const DEFAULT_LIMIT = 50;
const TOP_SHOWN = 10;
const README_CONCURRENCY = 4;

type Lists = RepoData['lists'];
type ListKey = `${PeriodDays}/${CategoryId}`;

function readArgs() {
  const { values } = parseArgs({
    options: {
      'dry-run': { type: 'boolean', default: false },
      'force-summaries': { type: 'boolean', default: false },
      limit: { type: 'string' },
    },
  });
  const limit = values.limit === undefined ? DEFAULT_LIMIT : Number(values.limit);
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error(`--limit must be a positive integer, got "${values.limit}"`);
  }
  return { dryRun: values['dry-run'], forceSummaries: values['force-summaries'], limit };
}

interface SearchResult {
  repos: Map<string, SearchRepo>;
  lists: Lists;
  /** Sub-queries that matched each repo, per list. */
  via: Map<ListKey, Map<string, string[]>>;
  /** Repos removed by the category relevance filter, per list. */
  filtered: Map<ListKey, SearchRepo[]>;
}

async function collectLists(client: Octokit, limit: number): Promise<SearchResult> {
  const repos = new Map<string, SearchRepo>();
  const lists = {} as Lists;
  const via = new Map<ListKey, Map<string, string[]>>();
  const filtered = new Map<ListKey, SearchRepo[]>();

  for (const period of PERIODS) {
    lists[`${period}`] = {} as Record<CategoryId, string[]>;
    for (const category of CATEGORY_IDS) {
      const merged = new Map<string, SearchRepo>();
      const matched = new Map<string, string[]>();
      for (const sub of CATEGORIES[category]) {
        const items = await searchRepos(client, buildQuery(period, sub));
        console.log(`  [${period}d/${category}] ${items.length.toString().padStart(3)} ← ${sub || '(base)'}`);
        for (const item of items) {
          merged.set(item.fullName, item);
          matched.set(item.fullName, [...(matched.get(item.fullName) ?? []), sub || '(base)']);
        }
      }
      const isRelevant = RELEVANCE[category] ?? (() => true);
      const sorted = [...merged.values()].sort((a, b) => b.stars - a.stars);
      const top = sorted.filter(isRelevant).slice(0, limit);
      for (const repo of top) repos.set(repo.fullName, repo);
      lists[`${period}`][category] = top.map((r) => r.fullName);
      via.set(`${period}/${category}`, matched);
      filtered.set(`${period}/${category}`, sorted.filter((r) => !isRelevant(r)));
    }
  }
  return { repos, lists, via, filtered };
}

function printListReport({ repos, lists, via, filtered }: SearchResult): void {
  console.log('\n=== Lists ===');
  for (const period of PERIODS) {
    for (const category of CATEGORY_IDS) {
      const key: ListKey = `${period}/${category}`;
      const names = lists[`${period}`][category];
      const matched = via.get(key)!;
      const flag = names.length < 20 ? '  ⚠ fewer than 20' : '';
      console.log(`\n${period}d / ${category}: ${names.length} repos${flag}`);
      names.slice(0, TOP_SHOWN).forEach((name, i) => {
        const r = repos.get(name)!;
        const tags = category === 'popular' ? '' : `  [${matched.get(name)!.join(' | ')}]`;
        console.log(`  ${i + 1}. ${name} ★${r.stars} — ${(r.description ?? '').slice(0, 60)}${tags}`);
      });
      const out = filtered.get(key)!;
      if (out.length > 0) {
        const sample = out.slice(0, 5).map((r) => `${r.fullName} ★${r.stars}`).join(', ');
        console.log(`  ✂ filtered out ${out.length} (top: ${sample})`);
      }
    }
  }

  // Per sub-query: how many list entries it matched, and how many only it matched.
  console.log('\n=== Sub-query contribution (in top lists, all periods) ===');
  for (const category of CATEGORY_IDS) {
    if (category === 'popular') continue;
    for (const sub of CATEGORIES[category]) {
      let total = 0;
      let only = 0;
      for (const period of PERIODS) {
        const matched = via.get(`${period}/${category}`)!;
        for (const name of lists[`${period}`][category]) {
          const subs = matched.get(name)!;
          if (subs.includes(sub)) {
            total++;
            if (subs.length === 1) only++;
          }
        }
      }
      console.log(`  ${category.padEnd(9)} ${String(total).padStart(3)} total, ${String(only).padStart(3)} unique ← ${sub}`);
    }
  }
}

async function main(): Promise<void> {
  const args = readArgs();
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is missing. Copy .env.example to .env and fill it in.');
  // Validate summary settings up front so a bad .env fails before the slow search phase.
  const summarizer: Summarizer | null = args.dryRun ? null : createSummarizer();

  const started = Date.now();
  const github = createClient(token);
  const result = await collectLists(github, args.limit);

  if (!summarizer) {
    printListReport(result);
    const secs = Math.round((Date.now() - started) / 1000);
    console.log(`\nSearch requests: ${stats.searchRequests} · unique repos: ${result.repos.size} · ${secs}s`);
    return;
  }

  // README fetch for every unique repo (core API, small concurrency).
  const repoList = [...result.repos.values()];
  console.log(`\nFetching READMEs for ${repoList.length} repos…`);
  const readmes = new Map<string, Readme | null>();
  await mapLimit(repoList, README_CONCURRENCY, async (repo) => {
    try {
      readmes.set(repo.fullName, await fetchReadme(github, repo.fullName));
    } catch (err) {
      console.warn(`  ⚠ README fetch failed for ${repo.fullName}: ${err instanceof Error ? err.message : err}`);
      readmes.set(repo.fullName, null);
    }
  });

  // Summaries: reuse cache when the input sha matches, otherwise call the model.
  const cache = loadCache(CACHE_PATH);
  const shas = new Map(repoList.map((r) => [r.fullName, inputSha(r, readmes.get(r.fullName)?.sha ?? null)]));
  const todo = repoList.filter((r) => args.forceSummaries || !getCached(cache, r.fullName, shas.get(r.fullName)!));
  const cacheHits = repoList.length - todo.length;
  const { model } = summarizer;
  console.log(`Summaries: ${cacheHits} cached, ${todo.length} to generate with ${summarizer.provider}/${model}…`);

  let done = 0;
  let succeeded = 0;
  // Account-level errors (bad key, no credits, no access) fail every call the same
  // way; stop instead of repeating them for hundreds of repos.
  let abortReason: string | null = null;
  await mapLimit(todo, summarizer.concurrency, async (repo) => {
    if (abortReason) return;
    const sha = shas.get(repo.fullName)!;
    try {
      const summary = await summarizer.summarize(repo, readmes.get(repo.fullName) ?? null);
      if (summary) {
        setCached(cache, repo.fullName, sha, model, summary);
        succeeded++;
      }
    } catch (err) {
      summaryStats.failures++;
      const message = err instanceof Error ? err.message : String(err);
      const status = err instanceof SummaryApiError ? err.status : undefined;
      const accountError =
        // Bad key / no access / unknown model, or rate limit still hit after retries (e.g. daily quota).
        status === 401 || status === 403 || status === 404 || status === 429 ||
        // A 400 before any success is almost always account/config (e.g. no credits, bad schema).
        (status === 400 && succeeded === 0);
      if (accountError) abortReason ??= message;
      else console.warn(`  ⚠ summary failed for ${repo.fullName}: ${message}`);
    }
    done++;
    if (done % 10 === 0 || done === todo.length) console.log(`  ${done}/${todo.length}`);
    // Save as we go so an interrupted run keeps its paid-for summaries.
    if (done % 10 === 0) saveCache(CACHE_PATH, cache);
  });
  saveCache(CACHE_PATH, cache);

  if (abortReason) {
    throw new Error(
      `Stopped summarizing after an account, quota or config error from ${summarizer.provider}:\n  ${abortReason}\n` +
        `${REPOS_PATH} was left unchanged; ${succeeded} new summaries were saved to the cache. ` +
        'Re-run later to continue from the cache.',
    );
  }

  const repos: Record<string, Repo> = {};
  for (const repo of repoList) {
    const summary = getCached(cache, repo.fullName, shas.get(repo.fullName)!);
    const hasReadme = readmes.get(repo.fullName) != null;
    repos[repo.fullName] = {
      ...repo,
      summary,
      summarySource: summary ? (hasReadme ? 'readme' : 'description') : null,
    };
  }
  const data: RepoData = { generatedAt: new Date().toISOString(), repos, lists: result.lists };
  writeFileSync(REPOS_PATH, `${JSON.stringify(data, null, 2)}\n`);

  const cost = summarizer.estimateCost(summaryStats);
  const missing = Object.values(repos).filter((r) => r.summary === null).length;
  const secs = Math.round((Date.now() - started) / 1000);
  console.log('\n=== Report ===');
  console.log(`Search requests:  ${stats.searchRequests}`);
  console.log(`Unique repos:     ${repoList.length} (${[...readmes.values()].filter((r) => r === null).length} without README)`);
  console.log(`Cache hits:       ${cacheHits}`);
  console.log(`LLM calls:        ${summaryStats.calls} (${summaryStats.failures} failed)`);
  console.log(`Tokens:           ${summaryStats.inputTokens} in / ${summaryStats.outputTokens} out`);
  const costText =
    cost !== null ? `$${cost.toFixed(4)}` : summarizer.provider === 'gemini' ? '$0 on the free tier' : `unknown (no price for ${model})`;
  console.log(`Est. cost:        ${costText}`);
  console.log(`Missing summary:  ${missing}`);
  console.log(`Wrote ${REPOS_PATH} and ${CACHE_PATH} in ${secs}s`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
