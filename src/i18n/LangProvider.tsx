import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { updateSearchParams } from '@/lib/urlState';
import { LangContext } from './context';
import { en } from './en';
import type { Lang } from './messages';
import { initialLang, saveLang } from './storage';
import { tr } from './tr';

const MESSAGES = { tr, en } as const;

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    saveLang(next);
    updateSearchParams({ lang: next });
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t: MESSAGES[lang] }), [lang, setLang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}
