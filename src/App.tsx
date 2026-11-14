import { useMemo } from 'react'
import { CategoryChips } from '@/components/CategoryChips'
import { LanguageFilter } from '@/components/LanguageFilter'
import { LangToggle } from '@/components/LangToggle'
import { PeriodTabs } from '@/components/PeriodTabs'
import { RepoCard } from '@/components/RepoCard'
import { SearchBox } from '@/components/SearchBox'
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/StatusViews'
import { useLang } from '@/i18n/useLang'
import { filterRepos, getList, languagesOf } from '@/lib/filter'
import { formatDate } from '@/lib/format'
import { useRepoData } from '@/lib/useRepoData'
import { useViewState } from '@/lib/urlState'

const RESULTS_ID = 'repo-results'

function App() {
  const { lang, t } = useLang()
  const repoData = useRepoData()
  const [view, updateView] = useViewState()

  const data = repoData.status === 'ready' ? repoData.data : null
  const list = useMemo(() => (data ? getList(data, view.period, view.category) : []), [data, view.period, view.category])
  const languages = useMemo(() => languagesOf(list), [list])
  const results = useMemo(() => filterRepos(list, view), [list, view])
  // Rank is the position in the unfiltered list, so it stays stable while searching.
  const ranks = useMemo(() => new Map(list.map((repo, i) => [repo.fullName, i + 1])), [list])
  const updated = data ? formatDate(data.generatedAt, lang) : null

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">{t.appName}</h1>
            <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">{t.tagline}</p>
            {updated && <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t.lastUpdated(updated)}</p>}
          </div>
          <LangToggle />
        </header>

        <main>
        <div className="mt-6 flex flex-col gap-3">
          <PeriodTabs value={view.period} onChange={(period) => updateView({ period })} controls={RESULTS_ID} />
          <CategoryChips value={view.category} onChange={(category) => updateView({ category })} />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <SearchBox value={view.query} onChange={(query) => updateView({ query })} />
            <LanguageFilter value={view.language} options={languages} onChange={(language) => updateView({ language })} />
          </div>
        </div>

        <section
          id={RESULTS_ID}
          role="tabpanel"
          aria-labelledby={`period-tab-${view.period}`}
          className="mt-6"
        >
          {repoData.status === 'loading' && <LoadingSkeleton />}
          {repoData.status === 'error' && <ErrorState onRetry={repoData.retry} />}
          {data && (
            <>
              <p className="text-sm text-zinc-600 dark:text-zinc-400" aria-live="polite">
                {t.resultCount(results.length)}
              </p>
              {results.length === 0 ? <EmptyState /> : (
              <ol className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
                {results.map((repo) => (
                  <li key={repo.fullName} className="flex [contain-intrinsic-size:auto_240px] [content-visibility:auto]">
                    <RepoCard repo={repo} rank={ranks.get(repo.fullName) ?? 0} />
                  </li>
                ))}
              </ol>
              )}
            </>
          )}
        </section>
        </main>
      </div>
    </div>
  )
}

export default App
