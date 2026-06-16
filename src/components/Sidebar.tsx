import { ChevronLeft, ChevronRight, ArrowLeft, Share2 } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getItemByName, getItemIconUrlFromSDEItem } from '../utils/sdeLoader';
import type { Series } from '../types';

interface SidebarProps {
  series: Series;
  collectionName?: { en: string; zh: string };
  selectedConfigIndex: number;
  onConfigChange: (index: number) => void;
  onSeriesChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  allSeries: Series[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  onBack?: () => void;
}

export function Sidebar({
  series,
  collectionName,
  selectedConfigIndex,
  onConfigChange,
  onSeriesChange,
  allSeries,
  collapsed,
  onToggleCollapse,
  onBack
}: SidebarProps) {
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

  const handleCopySeriesLink = () => {
    const parts = window.location.hash.split('/');
    const seriesHash = parts.slice(0, 3).join('/');
    copyToClipboard(getShareUrl(seriesHash.replace(/^#\//, '')), 'series');
  };

  return (
    <aside className={`${collapsed ? 'w-12' : 'w-64'} bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 flex-shrink-0 relative`}>
      {!collapsed && (
        <>
          {/* 顶部标题区 */}
          <div className="px-3 pt-5 pb-3 border-b border-gray-200 dark:border-gray-700">
            <div className="min-h-[36px] flex items-center justify-center px-6">
              <p className="text-base font-semibold text-gray-800 dark:text-gray-100 truncate leading-tight">
                {collectionName ? t(collectionName) : t(series.name)}
              </p>
            </div>
            {/* 系列选择器 */}
            <div className="mt-3 flex items-center gap-2">
              <select
                value={t(series.name)}
                onChange={onSeriesChange}
                className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400 focus:border-transparent text-gray-800 dark:text-gray-100"
              >
                {allSeries.map(s => (
                  <option key={s.name.en} value={t(s.name)}>
                    {t(s.name)}
                  </option>
                ))}
              </select>
              <button
                onClick={handleCopySeriesLink}
                className="flex items-center justify-center w-9 h-9 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors flex-shrink-0"
                title={t({ en: 'Share series link', zh: '分享系列链接' })}
              >
                {copiedId === 'series' ? (
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">{t({ en: 'OK', zh: '已复制' })}</span>
                ) : (
                  <Share2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* 配置列表 */}
          <div className="flex-1 p-3 overflow-y-auto">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3">
              {t({ en: 'Configurations', zh: '配置列表' })}
            </h3>
            <div className="space-y-2">
              {series.configs.map((config, index) => {
                const shipName = config.branches[0]?.fits[0]?.shipName;
                const shipItem = shipName ? getItemByName(shipName) : undefined;
                const iconUrl = shipItem && getItemIconUrlFromSDEItem(shipItem, 64);
                return (
                  <button
                    key={`config-${index}-${config.name.en}`}
                    onClick={() => onConfigChange(index)}
                    className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedConfigIndex === index
                        ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {iconUrl && (
                      <img src={iconUrl} alt="" className="w-6 h-6 flex-shrink-0" />
                    )}
                    <span className="truncate">{t(config.name)}</span>
                  </button>
                );
              })}
              {/* 返回合集 */}
              {onBack && (
                <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={onBack}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>{t({ en: 'Back to Collection', zh: '返回合集' })}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      
      {/* 收回按钮 (与右边栏对称: 左上角) */}
      <button
        onClick={onToggleCollapse}
        className={`absolute top-2 ${collapsed ? 'left-0' : 'left-2'} p-2 bg-violet-100 dark:bg-violet-900/50 hover:bg-violet-200 dark:hover:bg-violet-900/70 border border-violet-200 dark:border-violet-800 rounded-lg flex items-center justify-center transition-all duration-300 shadow-sm z-10`}
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4 text-violet-600 dark:text-violet-400" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-violet-600 dark:text-violet-400" />
        )}
      </button>
    </aside>
  );
}
