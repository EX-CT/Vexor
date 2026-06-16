import { ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { FitItem as FitItemComponent } from './FitItem';
import type { FitItem } from '../types';

interface EquipmentSectionProps {
  keyName: string;
  label: { en: string; zh: string };
  items: FitItem[];
  isExpanded: boolean;
  onToggle: () => void;
  alternativeSelections: Record<string, number>;
  onAlternativeChange: (selectionKey: string, value: number) => void;
}

export function EquipmentSection({
  keyName,
  label,
  items,
  isExpanded,
  onToggle,
  alternativeSelections,
  onAlternativeChange
}: EquipmentSectionProps) {
  const { t } = useLanguage();
  
  if (!items || items.length === 0) return null;

  const shouldMerge = ['high', 'med', 'low', 'rig', 'sub'].includes(keyName);
  let displayItems: Array<{ item: FitItem; count: number; originalIndex: number }> = [];

  if (shouldMerge) {
    const mergedMap = new Map<string, { item: FitItem; count: number; originalIndex: number }>();
    
    items.forEach((item, index) => {
      if (!item.alternatives || item.alternatives.length === 0) {
        const mergeKey = `${item.name}|${item.ammo || ''}`;
        const existing = mergedMap.get(mergeKey);
        if (existing) {
          existing.count++;
        } else {
          mergedMap.set(mergeKey, { 
            item: { ...item }, 
            count: 1, 
            originalIndex: index 
          });
        }
      } else {
        displayItems.push({ item, count: 1, originalIndex: index });
      }
    });
    
    displayItems = [
      ...Array.from(mergedMap.values()),
      ...displayItems
    ].sort((a, b) => a.originalIndex - b.originalIndex);
  } else {
    displayItems = items.map((item, index) => ({ item, count: 1, originalIndex: index }));
  }

  const totalCount = shouldMerge 
    ? displayItems.reduce((sum, { count }) => sum + count, 0)
    : items.length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-2">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-gray-800 dark:text-gray-100">{t(label)}</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">({totalCount})</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {isExpanded && (
        <div className="px-3 pb-3">
          {displayItems.map(({ item, count }, index) => (
            <FitItemComponent
              key={`${item.name}-${index}`}
              item={item}
              index={index}
              sectionKey={keyName}
              mergedCount={count}
              alternativeSelections={alternativeSelections}
              onAlternativeChange={onAlternativeChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
