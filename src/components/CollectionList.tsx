import { FolderOpen, ChevronRight, Share2 } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import type { Collection } from '../types';

interface CollectionListProps {
  collections: Collection[];
  onSelect: (collection: Collection) => void;
}

export function CollectionList({ collections, onSelect }: CollectionListProps) {
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          {t({ en: 'Select Collection', zh: '选择配置集合' })}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t({ en: 'Choose a collection to explore available fits', zh: '选择一个配置集合来浏览可用的舰船配置' })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {collections.map((collection, index) => (
          <button
            key={index}
            onClick={() => onSelect(collection)}
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-lg hover:border-violet-300 dark:hover:border-violet-600 transition-all text-left group flex items-center justify-between"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/50 rounded-xl flex items-center justify-center group-hover:bg-violet-200 dark:group-hover:bg-violet-900/70 transition-colors flex-shrink-0">
                <FolderOpen className="w-6 h-6 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate">
                    {t(collection.name)}
                  </h3>
                  <span className="text-xs px-2 py-0.5 bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 rounded-full font-medium flex-shrink-0">
                    {collection.series.length}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {t(collection.description)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
              <button
                onClick={(e) => { e.stopPropagation(); copyToClipboard(getShareUrl(collection.url), `collection-${index}`); }}
                className="flex items-center justify-center w-9 h-9 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                title={t({ en: 'Share collection link', zh: '分享合集链接' })}
              >
                {copiedId === `collection-${index}` ? (
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">OK</span>
                ) : (
                  <Share2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                )}
              </button>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors flex-shrink-0" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}