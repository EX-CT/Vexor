import type { SDEItem } from '../types';

let sdeData: Map<number, SDEItem> | null = null;
let nameToId: Map<string, number> | null = null;

export async function loadSDEData(): Promise<void> {
  if (sdeData) return;

  try {
    const response = await fetch('/sde/types.jsonl');
    const text = await response.text();
    const lines = text.split('\n').filter(line => line.trim());

    sdeData = new Map<number, SDEItem>();
    nameToId = new Map<string, number>();

    let sampleCount = 0;
    for (const line of lines) {
      try {
        const item: SDEItem = JSON.parse(line);
        sdeData.set(item._key, item);
        nameToId.set(item.name.en.toLowerCase(), item._key);

        // 打印前5个有iconID的样本
        if (item.iconID && sampleCount < 5) {
          console.log('SDE sample with iconID:', {
            name: item.name.en,
            _key: item._key,
            iconID: item.iconID
          });
          sampleCount++;
        }
      } catch {
        continue;
      }
    }

    console.log(`Loaded ${sdeData.size} items from SDE`);
  } catch (e) {
    console.error('Failed to load SDE data:', e);
    sdeData = new Map();
    nameToId = new Map();
  }
}

export function getItemById(id: number): SDEItem | undefined {
  return sdeData?.get(id);
}

export function getItemByName(name: string): SDEItem | undefined {
  const id = nameToId?.get(name.toLowerCase());
  if (id !== undefined) {
    return sdeData?.get(id);
  }
  return undefined;
}

export function getItemIconUrl(id: number, size: number = 64): string {
  return `https://images.evetech.net/types/${id}/icon?size=${size}`;
}

export function getItemIconUrlFromSDEItem(item: SDEItem, size: number = 64): string {
  console.log('Getting icon for item:', {
    name: item.name.en,
    _key: item._key,
    iconID: item.iconID
  });
  // 使用 _key (type ID) 作为图标 ID
  return `https://images.evetech.net/types/${item._key}/icon?size=${size}`;
}
