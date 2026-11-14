import { useRef, type KeyboardEvent } from 'react';
import { useLang } from '@/i18n/useLang';
import { PERIODS } from '@/lib/urlState';
import type { PeriodDays } from '@/types';

interface Props {
  value: PeriodDays;
  onChange: (period: PeriodDays) => void;
  /** id of the element the tabs control (the results list). */
  controls: string;
}

export function PeriodTabs({ value, onChange, controls }: Props) {
  const { t } = useLang();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const index = PERIODS.indexOf(value);
    const next =
      e.key === 'ArrowRight' ? (index + 1) % PERIODS.length
      : e.key === 'ArrowLeft' ? (index - 1 + PERIODS.length) % PERIODS.length
      : e.key === 'Home' ? 0
      : e.key === 'End' ? PERIODS.length - 1
      : -1;
    if (next < 0) return;
    e.preventDefault();
    onChange(PERIODS[next]);
    refs.current[next]?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label={t.periodTabsLabel}
      onKeyDown={onKeyDown}
      className="inline-flex rounded-lg bg-zinc-200/70 p-1 dark:bg-zinc-800/70"
    >
      {PERIODS.map((period, i) => {
        const selected = period === value;
        return (
          <button
            key={period}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`period-tab-${period}`}
            aria-selected={selected}
            aria-controls={controls}
            tabIndex={selected ? 0 : -1}
            title={t.periodLong[period]}
            onClick={() => onChange(period)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${
              selected
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            {t.period[period]}
          </button>
        );
      })}
    </div>
  );
}
