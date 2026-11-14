import { useLang } from '@/i18n/useLang';
import { formatDate, formatInteger, formatRelative, formatStars } from '@/lib/format';
import type { Repo } from '@/types';
import { InlineCode } from './InlineCode';

const MAX_TOPICS = 5;

export function RepoCard({ repo, rank }: { repo: Repo; rank: number }) {
  const { lang, t } = useLang();
  const summary = repo.summary?.[lang] ?? null;
  const [owner, name] = repo.fullName.split('/');

  return (
    <article className="flex w-full flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <header className="flex items-start gap-3">
        <span className="mt-0.5 min-w-8 font-mono text-sm font-semibold text-zinc-500 dark:text-zinc-400">{t.rank(rank)}</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base leading-snug font-semibold break-words">
            <a
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.openOnGitHub(repo.fullName)}
              className="rounded hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            >
              <span className="text-zinc-500 dark:text-zinc-400">{owner}/</span>
              {name}
            </a>
          </h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400">
            <span title={formatInteger(repo.stars, lang)}>
              <span aria-hidden="true">★ </span>
              <span className="sr-only">{t.starsLabel}: </span>
              {formatStars(repo.stars, lang)}
            </span>
            {repo.language && <span>{repo.language}</span>}
            <span>
              <span className="sr-only">{t.createdLabel}: </span>
              <time dateTime={repo.createdAt} title={formatDate(repo.createdAt, lang)}>
                {formatRelative(repo.createdAt, lang)}
              </time>
            </span>
          </p>
        </div>
      </header>

      {summary ? (
        <p className="text-sm leading-relaxed">{summary.what}</p>
      ) : (
        <div className="text-sm leading-relaxed">
          {repo.description && <p>{repo.description}</p>}
          <p className="mt-1 text-xs text-zinc-500 italic dark:text-zinc-400">{t.summaryPending}</p>
        </div>
      )}

      {summary && (
        <details className="group text-sm">
          <summary className="cursor-pointer rounded font-medium text-sky-700 select-none hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:text-sky-400">
            {t.howToUse}
          </summary>
          <div className="mt-2 space-y-2 border-l-2 border-zinc-200 pl-3 dark:border-zinc-700">
            <p className="leading-relaxed">
              <InlineCode text={summary.howToUse} />
            </p>
            {summary.useCases.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase dark:text-zinc-400">{t.useCases}</h3>
                <ul className="mt-1 list-disc space-y-0.5 pl-5">
                  {summary.useCases.map((useCase) => (
                    <li key={useCase}>{useCase}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </details>
      )}

      {repo.topics.length > 0 && (
        <ul className="mt-auto flex flex-wrap gap-1.5" aria-label={t.topicsLabel}>
          {repo.topics.slice(0, MAX_TOPICS).map((topic) => (
            <li
              key={topic}
              className="rounded-full bg-sky-50 px-2 py-0.5 text-xs text-sky-800 dark:bg-sky-950 dark:text-sky-300"
            >
              {topic}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
