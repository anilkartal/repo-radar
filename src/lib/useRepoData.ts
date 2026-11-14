import { useCallback, useEffect, useState } from 'react';
import type { RepoData } from '@/types';
import { loadRepoData } from './data';

export type RepoDataState =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'ready'; data: RepoData };

export function useRepoData(): RepoDataState & { retry: () => void } {
  const [state, setState] = useState<RepoDataState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    loadRepoData(undefined, controller.signal).then(
      (data) => setState({ status: 'ready', data }),
      (err: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: 'error', error: err instanceof Error ? err : new Error(String(err)) });
      },
    );
    return () => controller.abort();
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((n) => n + 1);
  }, []);

  return { ...state, retry };
}
