import { EquipmentSection } from './EquipmentSection';
import type { FitEquipment } from '../types';

interface EquipmentColumnProps {
  sections: Array<{
    key: keyof FitEquipment;
    label: { en: string; zh: string };
  }>;
  equipment: FitEquipment;
  expandedSections: Record<string, boolean>;
  onToggleSection: (key: string) => void;
  alternativeSelections: Record<string, number>;
  onAlternativeChange: (selectionKey: string, value: number) => void;
}

export function EquipmentColumn({
  sections,
  equipment,
  expandedSections,
  onToggleSection,
  alternativeSelections,
  onAlternativeChange
}: EquipmentColumnProps) {
  return (
    <div>
      {sections.map(({ key, label }) => {
        const items = equipment[key];
        if (!items || items.length === 0) return null;
        
        return (
          <EquipmentSection
            key={key}
            keyName={key}
            label={label}
            items={items}
            isExpanded={expandedSections[key] ?? true}
            onToggle={() => onToggleSection(key)}
            alternativeSelections={alternativeSelections}
            onAlternativeChange={onAlternativeChange}
          />
        );
      })}
    </div>
  );
}
