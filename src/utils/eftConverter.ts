import type { FitItem, FitSection } from '../types';

export function convertFitToEFT(
  fit: FitSection,
  fittingName: string = '',
  alternativeSelections: Record<string, number> = {}
): string {
  const lines: string[] = [];

  const hullName = fit.shipName;
  const name = fittingName || 'Untitled Fit';
  lines.push(`[${hullName}, ${name}]`);

  const addItems = (items: FitItem[], sectionKey: string) => {
    if (!items || items.length === 0) return;

    const shouldMerge = ['high', 'med', 'low', 'rig'].includes(sectionKey);

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

    displayItems.forEach(({ item, count }, displayIndex) => {
      const selectionKey = `${sectionKey}-${displayIndex}`;
      const altIndex = alternativeSelections[selectionKey];
      let finalName = item.name;

      if (item.alternatives && altIndex !== undefined && altIndex >= 0 && altIndex < item.alternatives.length) {
        const altPart = item.alternatives[altIndex];
        const commaIndex = altPart.indexOf(',');
        if (commaIndex > -1) {
          finalName = altPart.substring(0, commaIndex).trim();
        } else {
          finalName = altPart;
        }
      }

      const baseLine = finalName;

      for (let i = 0; i < count; i++) {
        let line = baseLine;

        if (item.ammo) {
          line += `, ${item.ammo}`;
        }

        if (item.offline) {
          line += ' /offline';
        }

        lines.push(line);
      }
    });
  };

  const addSection = (items: FitItem[], sectionKey: string) => {
    addItems(items, sectionKey);
    lines.push('');
  };

  addSection(fit.equipment.low, 'low');
  addSection(fit.equipment.med, 'med');
  addSection(fit.equipment.high, 'high');
  addSection(fit.equipment.rig, 'rig');
  addSection(fit.equipment.sub || [], 'sub');

  lines.push('');
  lines.push('');

  if (fit.equipment.drone && fit.equipment.drone.length > 0) {
    fit.equipment.drone.forEach(item => {
      let line = item.name;
      if (item.quantity && item.quantity > 1) {
        line += ` x${item.quantity}`;
      }
      lines.push(line);
    });
  }

  lines.push('');
  lines.push('');

  if (fit.equipment.cargo && fit.equipment.cargo.length > 0) {
    fit.equipment.cargo.forEach(item => {
      let line = item.name;
      if (item.quantity && item.quantity > 1) {
        line += ` x${item.quantity}`;
      }
      lines.push(line);
    });
  }

  if (fit.equipment.imp && fit.equipment.imp.length > 0) {
    lines.push('');
    lines.push('');

    fit.equipment.imp.forEach((item, index) => {
      const selectionKey = `imp-${index}`;
      const altIndex = alternativeSelections[selectionKey];
      let finalName = item.name;

      if (item.alternatives && altIndex !== undefined && altIndex >= 0 && altIndex < item.alternatives.length) {
        const altPart = item.alternatives[altIndex];
        const commaIndex = altPart.indexOf(',');
        if (commaIndex > -1) {
          finalName = altPart.substring(0, commaIndex).trim();
        } else {
          finalName = altPart;
        }
      }

      lines.push(finalName);
    });
  }

  return lines.join('\n').trim();
}