import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { LocaleText } from '../types';

type Language = 'en' | 'zh';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (text: LocaleText | string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('vexor-lang');
    return (saved === 'zh' || saved === 'en') ? saved : 'zh';
  });

  useEffect(() => {
    localStorage.setItem('vexor-lang', lang);
  }, [lang]);

  const t = (text: LocaleText | string): string => {
    if (typeof text === 'string') return text;
    return text[lang] || text.en || '';
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
