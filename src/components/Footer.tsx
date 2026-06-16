import { useLanguage } from '../context/LanguageContext';
import type { LocaleText } from '../types';

interface FooterProps {
  footer: LocaleText;
}

export function Footer({ footer }: FooterProps) {
  const { lang } = useLanguage();
  
  if (!footer.en && !footer.zh) return null;
  
  return (
    <footer className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-3 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {lang === 'zh' ? footer.zh : footer.en}
        </p>
      </div>
    </footer>
  );
}