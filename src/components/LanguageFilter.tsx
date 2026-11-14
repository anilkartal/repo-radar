import { useLang } from '@/i18n/useLang';

interface Props {
  value: string;
  options: string[];
  onChange: (language: string) => void;
}

/** Programming-language filter, built from the languages in the current list. */
export function LanguageFilter({ value, options, onChange }: Props) {
  const { t } = useLang();
  // Keep a selection from the URL visible even if the current list has no such repo.
  const all = value && !options.includes(value) ? [value, ...options] : options;
  return (
    <label className="block">
      <span className="sr-only">{t.languageFilterLabel}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sky-500 dark:border-zinc-700 dark:bg-zinc-900"
      >
        <option value="">{t.allLanguages}</option>
        {all.map((lang) => (
          <option key={lang} value={lang}>
            {lang}
          </option>
        ))}
      </select>
    </label>
  );
}
