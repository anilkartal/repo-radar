import type { RepoData } from '@/types';

export const DATA_URL = `${import.meta.env.BASE_URL}data/repos.json`;

function isRepoData(value: unknown): value is RepoData {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<RepoData>;
  return typeof v.generatedAt === 'string' && !!v.repos && typeof v.repos === 'object' && !!v.lists && typeof v.lists === 'object';
}

/** Fetch the generated repo list. Throws on HTTP errors or an unexpected shape. */
export async function loadRepoData(url: string = DATA_URL, signal?: AbortSignal): Promise<RepoData> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status} loading ${url}`);
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    // Dev servers and SPA hosts often answer missing files with index.html.
    throw new Error(`Invalid JSON from ${url} (file missing?)`);
  }
  if (!isRepoData(json)) throw new Error(`Unexpected data format in ${url}`);
  return json;
}
