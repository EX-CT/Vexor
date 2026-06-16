import { ArrowLeft, ChevronRight, Share2 } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getItemByName, getItemIconUrlFromSDEItem } from '../utils/sdeLoader';
import type { Collection, Series } from '../types';

interface SeriesListProps {
  collection: Collection;
  onSelect: (series: Series) => void;
  onBack: () => void;
}

export function SeriesList({ collection, onSelect, onBack }: SeriesListProps) {
  const { t } = useLanguage();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
    }
  };

  const getShareUrl = (path: string) => {
    return window.location.origin + window.location.pathname + '#/' + path;
  };

  const getShipIcons = (series: Series) => {
    const icons: { name: string; iconUrl: string }[] = [];
    series.configs.forEach(config => {
      const firstBranch = config.branches[0];
      const firstFit = firstBranch?.fits[0];
      if (firstFit?.shipName) {
        const sdeItem = getItemByName(firstFit.shipName);
        if (sdeItem) {
          icons.push({
            name: firstFit.shipName,
            iconUrl: getItemIconUrlFromSDEItem(sdeItem, 64)
          });
        }
      }
    });
    return icons;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>{t({ en: 'Back to Collections', zh: '返回配置集合' })}</span>
      </button>

      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">{t(collection.name)}</h2>
        <p className="text-gray-600 dark:text-gray-400">{t(collection.description)}</p>
      </div>

      <div className="space-y-4">
        {collection.series.map((series, index) => {
          const shipIcons = getShipIcons(series);
          return (
            <button
              key={index}
              onClick={() => onSelect(series)}
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-lg hover:border-violet-300 dark:hover:border-violet-600 transition-all text-left group flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 truncate">
                    {t(series.name)}
                  </h3>
                  <span className="text-xs px-2 py-0.5 bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 rounded-full font-medium">
                    {series.configs.length}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {t(series.description)}
                </p>
              </div>
              
              <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                <div className="flex -space-x-2">
                  {shipIcons.map((icon, i) => (
                    <div
                      key={i}
                      className={`w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-gray-800 overflow-hidden shadow-sm ${i >= 2 ? 'hidden md:block' : ''}`}
                      title={icon.name}
                    >
                      <img
                        src={icon.iconUrl}
                        alt={icon.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {shipIcons.length === 0 && (
                    <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-xs text-gray-400">?</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); copyToClipboard(getShareUrl(`${collection.url}/${series.url}`), `series-${index}`); }}
                  className="flex items-center justify-center w-9 h-9 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  title={t({ en: 'Share series link', zh: '分享系列链接' })}
                >
                  {copiedId === `series-${index}` ? (
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">OK</span>
                  ) : (
                    <Share2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  )}
                </button>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}