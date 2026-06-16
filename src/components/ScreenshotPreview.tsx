import { QRCodeSVG } from 'qrcode.react';
import { useLanguage } from '../context/LanguageContext';
import { getItemByName, getItemIconUrlFromSDEItem } from '../utils/sdeLoader';
import type { FitConfig, Branch, FitItem } from '../types';

interface ScreenshotPreviewProps {
  shipName: string;
  collectionName: string;
  seriesName: string;
  currentConfig: FitConfig;
  currentBranch: Branch;
  selectedFitIndex: number;
  alternativeSelections: Record<string, number>;
  url: string;
}

function EquipmentSection({ items, keyName, label, alternativeSelections, t, lang }: { 
  items: FitItem[], 
  keyName: string,
  label: string,
  alternativeSelections: Record<string, number>,
  t: (text: string | { en: string; zh: string }) => string,
  lang: 'en' | 'zh'
}) {
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
          mergedMap.set(mergeKey, { item: { ...item }, count: 1, originalIndex: index });
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

  const getAltNameOnly = (alt: string) => {
    const match = alt.match(/^(.+?)\s+x\d+$/i);
    return match ? match[1].trim() : alt;
  };
  const getAltQuantity = (alt: string): number | undefined => {
    const match = alt.match(/^.+\s+x(\d+)$/i);
    return match ? parseInt(match[1], 10) : undefined;
  };

  const getFinalName = (item: FitItem, displayIndex: number): { name: string; quantity?: number } => {
    const selectionKey = `${keyName}-${displayIndex}`;
    const altIndex = alternativeSelections[selectionKey];
    
    if (item.alternatives && altIndex !== undefined && altIndex >= 0 && altIndex < item.alternatives.length) {
      const altPart = item.alternatives[altIndex];
      return {
        name: getAltNameOnly(altPart),
        quantity: getAltQuantity(altPart) ?? item.quantity,
      };
    }
    
    return { name: item.name, quantity: item.quantity };
  };

  return (
    <div className="bg-white rounded-lg border border-violet-200 overflow-hidden mb-1">
      <div className="flex">
        <div className="flex-1 px-3 py-1">
          {displayItems.map(({ item, count }, displayIndex) => {
            const displayInfo = getFinalName(item, displayIndex);
            const sdeItem = getItemByName(displayInfo.name);
            const iconUrl = sdeItem ? getItemIconUrlFromSDEItem(sdeItem, 64) : null;
            const equipmentName = sdeItem 
              ? (lang === 'zh' ? (sdeItem.name.zh || sdeItem.name.en) : sdeItem.name.en)
              : displayInfo.name;
            
            const ammoSdeItem = item.ammo ? getItemByName(item.ammo) : null;
            const ammoIconUrl = ammoSdeItem ? getItemIconUrlFromSDEItem(ammoSdeItem, 64) : null;
            const ammoName = ammoSdeItem 
              ? (lang === 'zh' ? (ammoSdeItem.name.zh || ammoSdeItem.name.en) : ammoSdeItem.name.en)
              : item.ammo;

            return (
              <div key={`${keyName}-${displayIndex}`} className="flex items-center gap-2 py-1 border-b border-violet-100 last:border-b-0">
                {iconUrl && (
                  <img
                    src={iconUrl}
                    alt={equipmentName}
                    className="w-5 h-5 rounded bg-gray-100"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    {count > 1 && (
                      <span className="text-xs font-bold text-violet-600 bg-violet-50 px-1 py-0.5 rounded">{count}x</span>
                    )}
                    <span className="text-xs text-gray-800 truncate">{equipmentName}</span>
                    {displayInfo.quantity && displayInfo.quantity > 1 && !shouldMerge && (
                      <span className="text-xs font-bold text-violet-600 bg-violet-50 px-1 py-0.5 rounded">x{displayInfo.quantity}</span>
                    )}
                    {item.offline && (
                      <span className="text-xs text-gray-400">({t({ en: 'offline', zh: '离线' })})</span>
                    )}
                  </div>
                </div>
                {item.ammo && (
                  <div className="flex items-center gap-0.5 px-1 py-0.5 bg-amber-50 rounded border border-amber-200">
                    {ammoIconUrl && (
                      <img
                        src={ammoIconUrl}
                        alt={ammoName}
                        className="w-3 h-3 rounded bg-amber-100"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                    {item.ammoQuantity && (
                      <span className="text-xs font-bold text-amber-600">x{item.ammoQuantity}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="w-12 flex flex-col justify-center items-center bg-violet-50 border-l border-violet-200">
          <span className="text-xs font-medium text-violet-800 text-center leading-tight">{label}</span>
          <span className="text-xs text-violet-500">({items.length})</span>
        </div>
      </div>
    </div>
  );
}

export function ScreenshotPreview({
  shipName,
  collectionName,
  seriesName,
  currentConfig,
  currentBranch,
  selectedFitIndex,
  alternativeSelections,
  url,
}: ScreenshotPreviewProps) {
  const { t, lang } = useLanguage();
  const shipSdeItem = getItemByName(shipName);
  const currentFit = currentBranch.fits[selectedFitIndex];

  return (
    <div className="screenshot-preview bg-white text-gray-800 max-w-sm mx-auto font-sans shadow-xl rounded-xl overflow-hidden">
      {/* 顶部 - 网站信息（整体渐变背景） */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-4 py-2 flex items-center justify-between">
        <h1 className="text-sm font-bold">{t({ en: 'EXCT Fits', zh: '精密配置' })}</h1>
        <QRCodeSVG value={url} size={36} level="M" includeMargin={false} />
      </div>

      {/* 路径信息 */}
      <div className="px-4 py-2 bg-violet-50 border-b border-violet-200">
        <div className="flex items-center gap-3">
          {shipSdeItem && (
            <img
              src={getItemIconUrlFromSDEItem(shipSdeItem, 1024)}
              alt={shipName}
              className="w-10 h-10 rounded-lg bg-white border border-violet-200 object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 text-xs whitespace-nowrap overflow-hidden">
              {collectionName && <span className="text-violet-800 truncate min-w-0">{collectionName}</span>}
              {collectionName && seriesName && <span className="text-violet-500 flex-shrink-0">/</span>}
              {seriesName && <span className="text-violet-800 truncate min-w-0">{seriesName}</span>}
              {(collectionName || seriesName) && <span className="text-violet-500 flex-shrink-0">/</span>}
              <span className="text-violet-900 font-medium truncate min-w-0">{t(currentConfig.name)}</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs whitespace-nowrap overflow-hidden">
              <span className="text-violet-700 font-medium truncate min-w-0">
                {lang === 'zh' ? (shipSdeItem?.name.zh || shipName) : shipName}
              </span>
              <span className="text-violet-500 flex-shrink-0">&gt;</span>
              <span className="text-violet-800 truncate min-w-0">{t(currentBranch.name)}</span>
              <span className="text-violet-500 flex-shrink-0">&gt;</span>
              <span className="text-violet-700 flex-shrink-0">{t({ en: 'Ver', zh: '版本' })} {selectedFitIndex + 1}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 描述 */}
      {currentConfig.description && (
        <div className="px-4 py-1.5 bg-gray-50">
          <p className="text-xs text-gray-600">{t(currentConfig.description)}</p>
        </div>
      )}

      {/* Alert */}
      {currentBranch.alert && (
        <div className="px-4 py-1.5 bg-amber-50 border-y border-amber-200">
          <p className="text-xs text-amber-800">{t(currentBranch.alert)}</p>
        </div>
      )}

      {/* 装备配置 */}
      <div className="px-4 py-2 bg-gray-50">
        {currentFit?.equipment.high && currentFit.equipment.high.length > 0 && (
          <EquipmentSection 
            items={currentFit.equipment.high} 
            keyName="high"
            label={t({ en: 'High Slots', zh: '高槽' })}
            alternativeSelections={alternativeSelections}
            t={t}
            lang={lang}
          />
        )}

        {currentFit?.equipment.med && currentFit.equipment.med.length > 0 && (
          <EquipmentSection 
            items={currentFit.equipment.med} 
            keyName="med"
            label={t({ en: 'Medium Slots', zh: '中槽' })}
            alternativeSelections={alternativeSelections}
            t={t}
            lang={lang}
          />
        )}

        {currentFit?.equipment.low && currentFit.equipment.low.length > 0 && (
          <EquipmentSection 
            items={currentFit.equipment.low} 
            keyName="low"
            label={t({ en: 'Low Slots', zh: '低槽' })}
            alternativeSelections={alternativeSelections}
            t={t}
            lang={lang}
          />
        )}

        {currentFit?.equipment.rig && currentFit.equipment.rig.length > 0 && (
          <EquipmentSection 
            items={currentFit.equipment.rig} 
            keyName="rig"
            label={t({ en: 'Rigs', zh: '改装件' })}
            alternativeSelections={alternativeSelections}
            t={t}
            lang={lang}
          />
        )}

        {currentFit?.equipment.sub && currentFit.equipment.sub.length > 0 && (
          <EquipmentSection 
            items={currentFit.equipment.sub} 
            keyName="sub"
            label={t({ en: 'Subsystem', zh: '子系统' })}
            alternativeSelections={alternativeSelections}
            t={t}
            lang={lang}
          />
        )}

        {currentFit?.equipment.drone && currentFit.equipment.drone.length > 0 && (
          <EquipmentSection 
            items={currentFit.equipment.drone} 
            keyName="drone"
            label={t({ en: 'Drones', zh: '无人机' })}
            alternativeSelections={alternativeSelections}
            t={t}
            lang={lang}
          />
        )}

        {currentFit?.equipment.cargo && currentFit.equipment.cargo.length > 0 && (
          <EquipmentSection 
            items={currentFit.equipment.cargo} 
            keyName="cargo"
            label={t({ en: 'Cargo', zh: '货舱' })}
            alternativeSelections={alternativeSelections}
            t={t}
            lang={lang}
          />
        )}

        {currentFit?.equipment.imp && currentFit.equipment.imp.length > 0 && (
          <EquipmentSection 
            items={currentFit.equipment.imp} 
            keyName="imp"
            label={t({ en: 'Implants', zh: '植入体' })}
            alternativeSelections={alternativeSelections}
            t={t}
            lang={lang}
          />
        )}
      </div>
    </div>
  );
}
