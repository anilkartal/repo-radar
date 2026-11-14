import { createContext } from 'react';
import type { Lang, Messages } from './messages';

export interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Messages;
}

export const LangContext = createContext<LangContextValue | null>(null);
