import { useContext } from 'react';
import { LangContext, type LangContextValue } from './context';

export function useLang(): LangContextValue {
  const value = useContext(LangContext);
  if (!value) throw new Error('useLang must be used inside <LangProvider>.');
  return value;
}
