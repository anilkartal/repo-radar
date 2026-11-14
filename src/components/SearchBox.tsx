import { useLang } from '@/i18n/useLang';

interface Props {
  value: string;
  onChange: (query: string) => void;
}

export function SearchBox({ value, onChange }: Props) {
  const { t } = useLang();
  return (
    <label className="block w-full sm:max-w-xs">
      <span className="sr-only">{t.searchLabel}</span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t.searchPlaceholder}
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-500 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sky-500 dark:border-zinc-700 dark:bg-zinc-900 dark:placeholder:text-zinc-400"
      />
    </label>
  );
}
