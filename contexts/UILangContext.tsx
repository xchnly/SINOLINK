'use client';

import { createContext, useContext, useState } from 'react';
import { translations } from '@/lib/i18n';
import type { Translations, UILang } from '@/lib/i18n';

interface UILangContextValue {
  uiLang: UILang;
  setUILang: (lang: UILang) => void;
  t: Translations;
}

const UILangContext = createContext<UILangContextValue>({
  uiLang: 'id',
  setUILang: () => {},
  t: translations.id,
});

export function UILangProvider({ children }: { children: React.ReactNode }) {
  const [uiLang, setUILangState] = useState<UILang>(() => {
    if (typeof window === 'undefined') return 'id';
    const saved = localStorage.getItem('sinolink-ui-lang') as UILang;
    return saved && saved in translations ? saved : 'id';
  });

  const setUILang = (lang: UILang) => {
    setUILangState(lang);
    try {
      localStorage.setItem('sinolink-ui-lang', lang);
    } catch {
      // storage unavailable
    }
  };

  return (
    <UILangContext.Provider value={{ uiLang, setUILang, t: translations[uiLang] }}>
      {children}
    </UILangContext.Provider>
  );
}

export function useUILang() {
  return useContext(UILangContext);
}
