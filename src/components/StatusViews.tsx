import { useLang } from '@/i18n/useLang';

const SKELETON_CARDS = 6;

export function LoadingSkeleton() {
  const { t } = useLang();
  return (
    <div>
      <p role="status" className="sr-only">
        {t.loading}
      </p>
      <div aria-hidden="true" className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: SKELETON_CARDS }, (_, i) => (
          <div
            key={i}
            className="flex motion-safe:animate-pulse flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="h-4 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3 w-5/6 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex gap-2">
              <div className="h-4 w-14 rounded-full bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-4 w-16 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyState() {
  const { t } = useLang();
  return (
    <div className="mt-3 rounded-xl border border-dashed border-zinc-300 px-4 py-12 text-center dark:border-zinc-700">
      <p className="font-semibold">{t.emptyTitle}</p>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t.emptyHint}</p>
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useLang();
  return (
    <div
      role="alert"
      className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center dark:border-red-900 dark:bg-red-950/40"
    >
      <p className="font-semibold text-red-800 dark:text-red-300">{t.errorTitle}</p>
      <p className="mt-1 text-sm text-red-700 dark:text-red-300/80">{t.errorHint}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 dark:bg-red-400 dark:text-zinc-950 dark:hover:bg-red-300"
      >
        {t.retry}
      </button>
    </div>
  );
}
