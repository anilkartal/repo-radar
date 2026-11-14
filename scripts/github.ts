import { Octokit } from '@octokit/rest';
import type { PeriodDays, Repo } from '../src/types.ts';
import { MIN_STARS } from './categories.ts';

/** GitHub Search API allows 30 req/min authenticated; stay well under it. */
const SEARCH_INTERVAL_MS = 2500;
const MAX_RETRIES = 3;

export type SearchRepo = Omit<Repo, 'summary' | 'summarySource'>;

const noop = () => {};

export function createClient(token: string): Octokit {
  return new Octokit({
    auth: token,
    userAgent: 'repo-radar-fetch',
    // Failed requests (e.g. expected README 404s) are handled by our own retry/err logic.
    log: { debug: noop, info: noop, warn: console.warn, error: noop },
  });
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** YYYY-MM-DD for today minus `days`, in UTC. */
export function sinceDate(days: PeriodDays, now: Date = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export function buildQuery(days: PeriodDays, subQuery: string): string {
  const base = `created:>=${sinceDate(days)} stars:>=${MIN_STARS[days]} fork:false archived:false`;
  return subQuery ? `${subQuery} ${base}` : base;
}

interface HttpErrorLike {
  status: number;
  response?: { headers?: Record<string, string | number | undefined> };
}

function isHttpError(err: unknown): err is HttpErrorLike {
  return typeof err === 'object' && err !== null && typeof (err as { status?: unknown }).status === 'number';
}

/** How long to wait before retrying a rate-limited request, from response headers. */
function retryDelayMs(err: HttpErrorLike, attempt: number): number {
  const headers = err.response?.headers ?? {};
  const retryAfter = Number(headers['retry-after']);
  if (Number.isFinite(retryAfter) && retryAfter > 0) return retryAfter * 1000;
  const reset = Number(headers['x-ratelimit-reset']);
  if (Number.isFinite(reset) && reset > 0) {
    return Math.max(reset * 1000 - Date.now(), 0) + 1000;
  }
  return 2 ** attempt * 5000;
}

let lastSearchAt = 0;

async function throttle(): Promise<void> {
  const wait = lastSearchAt + SEARCH_INTERVAL_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastSearchAt = Date.now();
}

/** Count of search requests sent (including retries), for the end-of-run report. */
export const stats = { searchRequests: 0 };

export async function searchRepos(client: Octokit, q: string): Promise<SearchRepo[]> {
  for (let attempt = 0; ; attempt++) {
    await throttle();
    stats.searchRequests++;
    try {
      const res = await client.search.repos({ q, sort: 'stars', order: 'desc', per_page: 100 });
      return res.data.items.map(toSearchRepo);
    } catch (err) {
      const retryable = isHttpError(err) && (err.status === 403 || err.status === 429);
      if (!retryable || attempt >= MAX_RETRIES) throw err;
      const delay = retryDelayMs(err, attempt);
      console.warn(`  rate limited (${err.status}), retrying in ${Math.ceil(delay / 1000)}s…`);
      await sleep(delay);
    }
  }
}

type SearchItem = Awaited<ReturnType<Octokit['search']['repos']>>['data']['items'][number];

function toSearchRepo(item: SearchItem): SearchRepo {
  const spdx = item.license?.spdx_id;
  return {
    fullName: item.full_name,
    url: item.html_url,
    description: item.description?.trim() || null,
    stars: item.stargazers_count,
    forks: item.forks_count,
    language: item.language ?? null,
    license: spdx && spdx !== 'NOASSERTION' ? spdx : null,
    topics: item.topics ?? [],
    createdAt: item.created_at,
    pushedAt: item.pushed_at,
  };
}

// ---------------------------------------------------------------------------
// README fetch (core API, 5,000 req/h — no throttle beyond small concurrency)

export const README_MAX_CHARS = 12_000;
const TABLE_MAX_ROWS = 10;

export interface Readme {
  sha: string;
  /** Cleaned and truncated markdown, ready to send to the summarizer. */
  text: string;
  /** Length of the raw decoded README, for logging. */
  rawLength: number;
}

/** Fetch and clean a repo's README. Returns null when the repo has none. */
export async function fetchReadme(client: Octokit, fullName: string): Promise<Readme | null> {
  const [owner, repo] = fullName.split('/');
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await client.repos.getReadme({ owner, repo });
      let raw: string;
      if (res.data.encoding === 'none' && res.data.download_url) {
        // GitHub omits the content of files over 1 MB; fetch the raw file instead.
        const dl = await fetch(res.data.download_url);
        if (!dl.ok) throw Object.assign(new Error(`raw README download failed: ${dl.status}`), { status: dl.status });
        raw = await dl.text();
      } else {
        raw = Buffer.from(res.data.content, res.data.encoding as BufferEncoding).toString('utf8');
      }
      return { sha: res.data.sha, text: cleanReadme(raw), rawLength: raw.length };
    } catch (err) {
      if (isHttpError(err) && err.status === 404) return null;
      const retryable = isHttpError(err) && (err.status === 403 || err.status === 429 || err.status >= 500);
      if (!retryable || attempt >= MAX_RETRIES) throw err;
      await sleep(retryDelayMs(err, attempt));
    }
  }
}

/**
 * Reduce a README to the text that matters for a summary: drop HTML, badges,
 * images and comments, shorten long tables, then truncate to README_MAX_CHARS.
 */
export function cleanReadme(raw: string): string {
  // Split on fenced code blocks so their contents (e.g. `git clone <url>`) stay intact.
  const parts = raw.replace(/\r\n?/g, '\n').split(/(^```[\s\S]*?^```[^\n]*$)/m);
  let md = parts.map((part, i) => (i % 2 === 1 ? part : cleanProse(part))).join('');

  md = md.replace(/\n{3,}/g, '\n\n').trim();
  if (md.length <= README_MAX_CHARS) return md;
  const cut = md.lastIndexOf('\n', README_MAX_CHARS);
  return `${md.slice(0, cut > README_MAX_CHARS * 0.8 ? cut : README_MAX_CHARS)}\n\n…(truncated)`;
}

const HTML_TAGS =
  'a|abbr|b|blockquote|br|center|code|dd|del|details|div|dl|dt|em|font|h[1-6]|hr|i|img|ins|kbd|li|ol|p|pre|s|small|source|span|strong|sub|summary|sup|table|tbody|td|th|thead|tr|u|ul';
const HTML_TAG_RE = new RegExp(`</?(?:${HTML_TAGS})\\b[^>]*>`, 'gi');

/** Cleanup for README text outside fenced code blocks. */
function cleanProse(text: string): string {
  let md = text.replace(/<!--[\s\S]*?-->/g, '');
  // Linked images ([![alt](img)](href)) and plain images (![alt](img)) — mostly badges/screenshots.
  md = md.replace(/\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)/g, '');
  md = md.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
  md = md.replace(/\[!\[[^\]]*\]\[[^\]]*\]\]\[[^\]]*\]/g, '');
  // Media blocks with their contents, then known HTML tags (keep inner text).
  md = md.replace(/<(picture|video|svg|style|script)\b[\s\S]*?<\/\1>/gi, '');
  md = md.replace(/<br\s*\/?>/gi, '\n');
  md = md.replace(/<\/(?:p|div|h[1-6]|li|summary|details|tr|blockquote)>/gi, '\n');
  md = md.replace(HTML_TAG_RE, '');
  md = md.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

  return shortenTables(md)
    .split('\n')
    .map((line) => line.trimEnd())
    // Lines left holding only empty link shells like "[](https://…)".
    .filter((line) => !/^\s*(\[\]\([^)]*\)\s*)+$/.test(line))
    .join('\n');
}

/** Keep the header and first TABLE_MAX_ROWS rows of each markdown table. */
function shortenTables(md: string): string {
  const out: string[] = [];
  let tableRows = 0;
  let skipped = 0;
  for (const line of md.split('\n')) {
    const isRow = /^\s*\|.*\|\s*$/.test(line);
    if (isRow) {
      tableRows++;
      // +2 for the header row and the |---| separator.
      if (tableRows <= TABLE_MAX_ROWS + 2) out.push(line);
      else skipped++;
      continue;
    }
    if (skipped > 0) out.push(`| … ${skipped} more rows |`);
    tableRows = 0;
    skipped = 0;
    out.push(line);
  }
  if (skipped > 0) out.push(`| … ${skipped} more rows |`);
  return out.join('\n');
}
