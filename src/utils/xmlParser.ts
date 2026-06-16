import type { MainData } from '../types';
import { fitsData } from '../data/fitsData';

export async function parseFitsDirectory(): Promise<MainData> {
  return Promise.resolve(fitsData);
}