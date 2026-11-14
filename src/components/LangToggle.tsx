import { useLang } from '@/i18n/useLang';
import type { Lang } from '@/i18n/messages';

const LANGS: readonly Lang[] = ['tr', 'en'];

export function LangToggle() {
  const { lang, setLang, t } = useLang();
  return (
    <div role="group" aria-label={t.langToggleLabel} className="inline-flex rounded-lg border border-zinc-300 p-0.5 dark:border-zinc-700">
      {LANGS.map((code) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-pressed={lang === code}
          title={t.langName[code]}
          onClick={() => setLang(code)}
          className={`rounded-md px-2 py-1 text-xs font-semibold uppercase focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sky-500 ${
            lang === code
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
