import { useLang } from '@/i18n/useLang';
import { CATEGORIES } from '@/lib/urlState';
import type { CategoryId } from '@/types';

interface Props {
  value: CategoryId;
  onChange: (category: CategoryId) => void;
}

export function CategoryChips({ value, onChange }: Props) {
  const { t } = useLang();
  return (
    <div role="group" aria-label={t.categoryChipsLabel} className="flex flex-wrap gap-2">
      {CATEGORIES.map((category) => {
        const selected = category === value;
        return (
          <button
            key={category}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(category)}
            className={`rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${
              selected
                ? 'border-sky-700 bg-sky-700 text-white dark:border-sky-400 dark:bg-sky-400 dark:text-zinc-950'
                : 'border-zinc-300 text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500'
            }`}
          >
            {t.category[category]}
          </button>
        );
      })}
    </div>
  );
}
