import type { SDEItem } from '../types';
import { sdeData, sdeNameToId } from '../data/sdeData';

let sdeMap: Map<number, SDEItem> | null = null;

export async function loadSDEData(): Promise<void> {
  if (sdeMap) return;

  sdeMap = new Map<number, SDEItem>();
  for (const item of sdeData) {
    sdeMap.set(item._key, item);
  }

  console.log(`Loaded ${sdeMap.size} items from SDE`);
}

export function getItemById(id: number): SDEItem | undefined {
  return sdeMap?.get(id);
}

export function getItemByName(name: string): SDEItem | undefined {
  const id = sdeNameToId[name.toLowerCase()];
  if (id !== undefined) {
    return sdeMap?.get(id);
  }
  return undefined;
}

export function getItemIconUrl(id: number, size: number = 64): string {
  return `https://images.evetech.net/types/${id}/icon?size=${size}`;
}

export function getItemIconUrlFromSDEItem(item: SDEItem, size: number = 64): string {
  return `https://images.evetech.net/types/${item._key}/icon?size=${size}`;
}