import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
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
}

export function Sidebar({
  series,
  collectionName,
  selectedConfigIndex,
  onConfigChange,
  onSeriesChange,
  allSeries,
  collapsed,
  onToggleCollapse
}: SidebarProps) {
  const { t } = useLanguage();

  return (
    <aside className={`${collapsed ? 'w-12' : 'w-64'} bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 flex-shrink-0 relative`}>
      {!collapsed && (
        <>
          {/* Collection 名称 */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
              {collectionName ? t(collectionName) : t(series.name)}
            </p>
          </div>

          {/* 系列选择器 */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              {t({ en: 'Series', zh: '系列' })}
            </label>
            <select
              value={t(series.name)}
              onChange={onSeriesChange}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400 focus:border-transparent text-gray-800 dark:text-gray-100"
            >
              {allSeries.map(s => (
                <option key={s.name.en} value={t(s.name)}>
                  {t(s.name)}
                </option>
              ))}
            </select>
          </div>

          {/* 配置列表 */}
          <div className="flex-1 p-3 overflow-y-auto">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3">
              {t({ en: 'Configurations', zh: '配置列表' })}
            </h3>
            <div className="space-y-2">
              {series.configs.map((config, index) => (
                <button
                  key={`config-${index}-${config.name.en}`}
                  onClick={() => onConfigChange(index)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedConfigIndex === index
                      ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {t(config.name)}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
      
      {/* 收回按钮 */}
      <button
        onClick={onToggleCollapse}
        className={`absolute top-1/2 -translate-y-1/2 ${collapsed ? 'right-0' : 'right-0'} w-5 h-14 bg-violet-100 dark:bg-violet-900/50 hover:bg-violet-200 dark:hover:bg-violet-900/70 border-l border-violet-200 dark:border-violet-800 rounded-l-lg flex items-center justify-center transition-all duration-300 shadow-md`}
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
