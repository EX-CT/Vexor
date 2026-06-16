import type { FitItem, FitSection } from '../types';

function parseItemLine(input: string): { name: string; quantity?: number } {
  const match = input.match(/^(.+?)\s+x(\d+)$/i);
  if (match) {
    return { name: match[1].trim(), quantity: parseInt(match[2], 10) };
  }
  return { name: input };
}

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

    const shouldMerge = ['high', 'med', 'low', 'rig', 'sub'].includes(sectionKey);

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
      let finalQuantity = item.quantity;

      if (item.alternatives && altIndex !== undefined && altIndex >= 0 && altIndex < item.alternatives.length) {
        const altPart = item.alternatives[altIndex];
        const parsed = parseItemLine(altPart);
        finalName = parsed.name;
        finalQuantity = parsed.quantity ?? item.quantity;
      }

      for (let i = 0; i < count; i++) {
        let line = finalName;

        if (finalQuantity && finalQuantity > 1) {
          line += ` x${finalQuantity}`;
        }

        if (item.ammo) {
          line += `, ${item.ammo}`;
          if (item.ammoQuantity && item.ammoQuantity > 1) {
            line += ` x${item.ammoQuantity}`;
          }
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

  // Drone
  if (fit.equipment.drone && fit.equipment.drone.length > 0) {
    fit.equipment.drone.forEach((item, index) => {
      const selectionKey = `drone-${index}`;
      const altIndex = alternativeSelections[selectionKey];

      let finalName = item.name;
      let finalQuantity = item.quantity;

      if (item.alternatives && altIndex !== undefined && altIndex >= 0 && altIndex < item.alternatives.length) {
        const parsed = parseItemLine(item.alternatives[altIndex]);
        finalName = parsed.name;
        finalQuantity = parsed.quantity ?? item.quantity;
      }

      let line = finalName;
      if (finalQuantity && finalQuantity > 1) {
        line += ` x${finalQuantity}`;
      }
      lines.push(line);
    });
  }

  lines.push('');
  lines.push('');

  // Cargo
  if (fit.equipment.cargo && fit.equipment.cargo.length > 0) {
    fit.equipment.cargo.forEach((item, index) => {
      const selectionKey = `cargo-${index}`;
      const altIndex = alternativeSelections[selectionKey];

      let finalName = item.name;
      let finalQuantity = item.quantity;

      if (item.alternatives && altIndex !== undefined && altIndex >= 0 && altIndex < item.alternatives.length) {
        const parsed = parseItemLine(item.alternatives[altIndex]);
        finalName = parsed.name;
        finalQuantity = parsed.quantity ?? item.quantity;
      }

      let line = finalName;
      if (finalQuantity && finalQuantity > 1) {
        line += ` x${finalQuantity}`;
      }
      lines.push(line);
    });
  }

  // Implants
  if (fit.equipment.imp && fit.equipment.imp.length > 0) {
    lines.push('');
    lines.push('');

    fit.equipment.imp.forEach((item, index) => {
      const selectionKey = `imp-${index}`;
      const altIndex = alternativeSelections[selectionKey];

      let finalName = item.name;

      if (item.alternatives && altIndex !== undefined && altIndex >= 0 && altIndex < item.alternatives.length) {
        finalName = parseItemLine(item.alternatives[altIndex]).name;
      }

      lines.push(finalName);
    });
  }

  return lines.join('\n').trim();
}
