import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { z } from 'zod';
import type { RepoSummary } from '../src/types.ts';
import type { SearchRepo } from './github.ts';
import { summarySchema } from './summarize.ts';

const entrySchema = z.object({
  readmeSha: z.string(),
  model: z.string(),
  summarizedAt: z.string(),
  summary: summarySchema,
});

const cacheSchema = z.record(z.string(), entrySchema);

export type CacheEntry = z.infer<typeof entrySchema>;
export type SummaryCache = Record<string, CacheEntry>;

export function loadCache(path: string): SummaryCache {
  if (!existsSync(path)) return {};
  const parsed = cacheSchema.safeParse(JSON.parse(readFileSync(path, 'utf8')));
  if (!parsed.success) {
    throw new Error(`${path} is not a valid summary cache: ${parsed.error.issues[0]?.message ?? 'unknown error'}`);
  }
  return parsed.data;
}

/** Write with sorted keys so diffs stay small and stable. Entries are never removed. */
export function saveCache(path: string, cache: SummaryCache): void {
  const sorted = Object.fromEntries(Object.entries(cache).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(path, `${JSON.stringify(sorted, null, 2)}\n`);
}

/**
 * Cache key for the summary input. Repos with a README use its blob sha; repos
 * without one use a hash of description + topics so edits trigger a re-summary.
 */
export function inputSha(repo: SearchRepo, readmeSha: string | null): string {
  if (readmeSha) return readmeSha;
  const hash = createHash('sha1').update(`${repo.description ?? ''}\n${repo.topics.join(',')}`).digest('hex');
  return `desc:${hash}`;
}

export function getCached(cache: SummaryCache, fullName: string, sha: string): RepoSummary | null {
  const entry = cache[fullName];
  return entry && entry.readmeSha === sha ? entry.summary : null;
}

export function setCached(cache: SummaryCache, fullName: string, sha: string, model: string, summary: RepoSummary): void {
  cache[fullName] = { readmeSha: sha, model, summarizedAt: new Date().toISOString(), summary };
}
