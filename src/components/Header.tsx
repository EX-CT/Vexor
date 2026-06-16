import { useState } from 'react';
import { Globe, ChevronRight, Sun, Moon, FileText, X, Heart, Code } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useDarkMode } from '../context/DarkModeContext';
import type { LocaleText } from '../types';

interface PathSegment {
  label: string;
  active?: boolean;
}

interface HeaderProps {
  title?: LocaleText;
  path?: PathSegment[];
  onHome?: () => void;
}

const LEGAL_TEXT = `FENRIS Copyright Notice

EVE Online and the EVE logo are the registered trademarks of FENRIS. All rights are reserved worldwide. All other trademarks are the property of their respective owners. EVE Online, the EVE logo, EVE and all associated logos and designs are the intellectual property of FENRIS. All artwork, screenshots, characters, vehicles, storylines, world facts or other recognizable features of the intellectual property relating to these trademarks are likewise the intellectual property of FENRIS.`;

export function Header({ title, path, onHome }: HeaderProps) {
  const { lang, setLang, t } = useLanguage();
  const { isDark, toggleDark } = useDarkMode();
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);

  const toggleLang = () => {
    setLang(lang === 'zh' ? 'en' : 'zh');
  };

  return (
    <>
      <header className="bg-gradient-to-r from-purple-900 via-violet-800 to-purple-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div 
              className={`flex items-center gap-3 ${onHome ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
              onClick={onHome}
            >
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-10 h-10 rounded-lg"
              />
              <h1 className="text-xl font-bold">{lang === 'zh' ? 'EXCT 配置' : 'EXCT Fits'}</h1>
            </div>
            
            {path && path.length > 0 && (
              <div className="hidden md:flex items-center gap-1 text-sm text-white/80">
                {path.map((segment, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <ChevronRight className="w-3 h-3" />
                    <span className={segment.active ? 'text-white font-medium' : ''}>
                      {segment.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {title && !path && (
            <div className="text-center">
              <h2 className="text-lg font-semibold">{t(title)}</h2>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDonateModal(true)}
              className="flex items-center justify-center w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title={lang === 'zh' ? '捐款支持' : 'Donate'}
            >
              <Heart className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowLegalModal(true)}
              className="flex items-center justify-center w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title={lang === 'zh' ? '法律声明' : 'Legal Notice'}
            >
              <FileText className="w-5 h-5" />
            </button>
            <button
              onClick={toggleDark}
              className="flex items-center justify-center w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title={isDark ? (lang === 'zh' ? '切换到亮色模式' : 'Switch to light mode') : (lang === 'zh' ? '切换到暗色模式' : 'Switch to dark mode')}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={toggleLang}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <Globe className="w-5 h-5" />
              <span>{lang === 'zh' ? 'EN' : '中文'}</span>
            </button>
          </div>
        </div>
      </header>

      {showLegalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-md"
            onClick={() => setShowLegalModal(false)}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {lang === 'zh' ? '法律声明' : 'Legal Notice'}
              </h3>
              <button
                onClick={() => setShowLegalModal(false)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
                {LEGAL_TEXT}
              </pre>
            </div>
            <div className="flex items-center justify-end p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <button
                onClick={() => setShowLegalModal(false)}
                className="px-4 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
              >
                {lang === 'zh' ? '关闭' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDonateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-md"
            onClick={() => setShowDonateModal(false)}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="bg-gradient-to-r from-purple-600 to-violet-600 p-6 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">{lang === 'zh' ? '支持开发者' : 'Support the Developer'}</h3>
              <p className="text-white/80 text-sm mt-1">
                {lang === 'zh' ? '您的支持是我们持续开发的动力' : 'Your support keeps this project going'}
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                    <Code className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </span>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                    {lang === 'zh' ? '开源代码' : 'Open Source'}
                  </h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {lang === 'zh' ? '本项目采用 MIT 开源协议，欢迎贡献代码或提交问题。' : 'This project is licensed under MIT. Contributions and issues are welcome.'}
                </p>
                <a
                  href="https://github.com/EX-CT/Vexor"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg transition-colors text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  <Code className="w-4 h-4" />
                  <span className="truncate">github.com/EX-CT/Vexor</span>
                </a>
              </div>
              
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                  {lang === 'zh' ? '游戏内捐款' : 'In-Game Donation'}
                </h4>
                <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                  {lang === 'zh' ? '游戏人物：Vardal' : 'In-Game Character: Vardal'}
                </h4>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {lang === 'zh' ? '欢迎在游戏内向 Vardal 捐款 ISK，您的每一份支持都非常宝贵！' : 'Feel free to donate ISK to Vardal in-game. Every bit of support is greatly appreciated!'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-end p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <button
                onClick={() => setShowDonateModal(false)}
                className="px-4 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
              >
                {lang === 'zh' ? '关闭' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
