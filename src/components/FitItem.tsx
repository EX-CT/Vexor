import { useLanguage } from '../context/LanguageContext';
import { getItemByName, getItemIconUrlFromSDEItem } from '../utils/sdeLoader';
import type { FitItem } from '../types';

interface FitItemProps {
  item: FitItem;
  index: number;
  sectionKey: string;
  mergedCount: number;
  alternativeSelections: Record<string, number>;
  onAlternativeChange: (selectionKey: string, value: number) => void;
}

export function FitItem({
  item,
  index,
  sectionKey,
  mergedCount,
  alternativeSelections,
  onAlternativeChange
}: FitItemProps) {
  const { t, lang } = useLanguage();
  const selectionKey = `${sectionKey}-${index}`;
  const altIndex = alternativeSelections[selectionKey] ?? -1;
  
  const displayName = altIndex >= 0 && item.alternatives?.[altIndex] 
    ? item.alternatives[altIndex] 
    : item.name;
  
  const sdeItem = getItemByName(displayName);
  const iconUrl = sdeItem ? getItemIconUrlFromSDEItem(sdeItem, 64) : null;
  
  const equipmentName = sdeItem 
    ? (lang === 'zh' ? (sdeItem.name.zh || sdeItem.name.en) : sdeItem.name.en)
    : displayName;
  
  const ammoSdeItem = item.ammo ? getItemByName(item.ammo) : null;
  const ammoIconUrl = ammoSdeItem ? getItemIconUrlFromSDEItem(ammoSdeItem, 64) : null;
  
  const ammoName = ammoSdeItem 
    ? (lang === 'zh' ? (ammoSdeItem.name.zh || ammoSdeItem.name.en) : ammoSdeItem.name.en)
    : item.ammo;

  const getAltName = (altName: string) => {
    const altSdeItem = getItemByName(altName);
    if (altSdeItem) {
      return lang === 'zh' ? (altSdeItem.name.zh || altSdeItem.name.en) : altSdeItem.name.en;
    }
    return altName;
  };

  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
      {iconUrl && (
        <img
          src={iconUrl}
          alt={equipmentName}
          className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-700"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {mergedCount > 1 && (
            <span className="text-base font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 px-1.5 py-0.5 rounded">{mergedCount}x</span>
          )}
          <span className="text-sm text-gray-800 dark:text-gray-100 truncate">{equipmentName}</span>
          {item.quantity && (
            <span className="text-base font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 px-1.5 py-0.5 rounded">x{item.quantity}</span>
          )}
          {item.offline && (
            <span className="text-xs text-gray-400 dark:text-gray-500">{t({ en: '(offline)', zh: '(离线)' })}</span>
          )}
        </div>
        {item.alternatives && item.alternatives.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            <button
              onClick={() => onAlternativeChange(selectionKey, -1)}
              className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                altIndex === -1 
                  ? 'bg-violet-100 dark:bg-violet-900/50 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300' 
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              {getAltName(item.name)}
            </button>
            {item.alternatives.map((alt, i) => (
              <button
                key={i}
                onClick={() => onAlternativeChange(selectionKey, i)}
                className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                  altIndex === i 
                    ? 'bg-violet-100 dark:bg-violet-900/50 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300' 
                    : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                {getAltName(alt)}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {item.ammo && (
        <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-900/30 rounded-lg border border-amber-200 dark:border-amber-800">
          {ammoIconUrl && (
            <img
              src={ammoIconUrl}
              alt={ammoName}
              className="w-6 h-6 rounded bg-amber-100 dark:bg-amber-900/50"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          <div className="flex flex-col">
            <span className="text-sm text-amber-800 dark:text-amber-200">{ammoName}</span>
            {item.ammoQuantity && (
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">x{item.ammoQuantity}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
