import type { MainData, Collection, Series, FitConfig, Branch, FitSection, FitItem, FitEquipment, LocaleText } from '../types';

function parseLocaleText(xmlContent: string, tagName: string): LocaleText {
  const result: LocaleText = { en: '', zh: '' };
  const regex = new RegExp(`<${tagName}\\s+lang="([^"]+)">([^<]+)</${tagName}>`, 'gi');
  let match;
  while ((match = regex.exec(xmlContent)) !== null) {
    const lang = match[1];
    const text = match[2].trim();
    if (lang === 'en') result.en = text;
    else if (lang === 'zh') result.zh = text;
  }
  return result;
}

function extractRootContent(xmlContent: string): string {
  const match = xmlContent.match(/<root>([\s\S]*)<\/root>/);
  return match ? match[1].trim() : xmlContent;
}

function parseRootLocaleText(xmlContent: string, tagName: string): LocaleText {
  const result: LocaleText = { en: '', zh: '' };

  const rootContent = extractRootContent(xmlContent);

  const lines = rootContent.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith(`<${tagName}`)) {
      const langMatch = trimmed.match(/lang="([^"]+)"/);
      const textMatch = trimmed.match(/>([^<]+)</);
      if (langMatch && textMatch) {
        const lang = langMatch[1];
        const text = textMatch[1].trim();
        if (lang === 'en') result.en = text;
        else if (lang === 'zh') result.zh = text;
      }
    }
  }

  return result;
}

function parseFitItem(line: string): FitItem {
  const item: FitItem = { name: '' };

  let remaining = line.trim();

  if (remaining.endsWith('#')) {
    item.offline = true;
    remaining = remaining.slice(0, -1).trim();
  }

  const parts = remaining.split('==');
  const mainPart = parts[0];

  // 先按逗号分割，第一部分是装备，第二部分是弹药
  const commaParts = mainPart.split(',');
  const equipmentPart = commaParts[0].trim();
  const ammoPart = commaParts.length > 1 ? commaParts.slice(1).join(',').trim() : null;

  // 解析装备名称和数量（如 "Imperial Navy Acolyte x5"）
  const equipMatch = equipmentPart.match(/^(.+?)\s+x(\d+)$/i);
  if (equipMatch) {
    item.name = equipMatch[1].trim();
    item.quantity = parseInt(equipMatch[2], 10);
  } else {
    item.name = equipmentPart;
  }

  // 解析弹药名称和数量
  if (ammoPart) {
    const ammoMatch = ammoPart.match(/^(.+?)\s+x(\d+)$/i);
    if (ammoMatch) {
      item.ammo = ammoMatch[1].trim();
      item.ammoQuantity = parseInt(ammoMatch[2], 10);
    } else {
      item.ammo = ammoPart;
    }
  }

  if (parts.length > 1) {
    item.alternatives = parts.slice(1).map(p => p.trim().split(',')[0].trim());
  }

  return item;
}

function parseFitSection(fitContent: string): FitSection {
  const equipment: FitEquipment = {
    low: [],
    med: [],
    high: [],
    rig: [],
    drone: [],
    cargo: [],
  };

  let shipName = '';

  const sections = ['low', 'med', 'high', 'rig', 'drone', 'cargo', 'imp', 'sub'] as const;
  type ItemSection = typeof sections[number];
  let currentSection: ItemSection | null = null;

  const lines = fitContent.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const bracketMatch = trimmed.match(/^\[([^\]]+)\]$/);
    if (bracketMatch) {
      const content = bracketMatch[1].toLowerCase();
      if (sections.includes(content as ItemSection)) {
        currentSection = content as ItemSection;
      } else {
        shipName = bracketMatch[1].trim();
      }
      continue;
    }

    if (currentSection && trimmed && !trimmed.startsWith('[')) {
      if (!equipment[currentSection]) {
        equipment[currentSection] = [];
      }
      equipment[currentSection]!.push(parseFitItem(trimmed));
    }
  }

  return { shipName, equipment };
}

function parseBranch(branchContent: string): Branch {
  const branch: Branch = {
    name: parseLocaleText(branchContent, 'bname'),
    fits: [],
  };

  const alert = parseLocaleText(branchContent, 'alert');
  if (alert.en || alert.zh) branch.alert = alert;

  const note = parseLocaleText(branchContent, 'note');
  if (note.en || note.zh) branch.note = note;

  const fitRegex = /<fit[^>]*>([\s\S]*?)<\/fit>/gi;
  let fitMatch;
  while ((fitMatch = fitRegex.exec(branchContent)) !== null) {
    branch.fits.push(parseFitSection(fitMatch[1]));
  }

  return branch;
}

function parseConfigFile(xmlContent: string): FitConfig {
  const config: FitConfig = {
    url: '',
    name: parseLocaleText(xmlContent, 'name'),
    description: parseLocaleText(xmlContent, 'description'),
    branches: [],
  };

  const urlMatch = xmlContent.match(/<url>([^<]+)<\/url>/);
  if (urlMatch) config.url = urlMatch[1].trim();

  const branchRegex = /<branch>([\s\S]*?)<\/branch>/gi;
  let branchMatch;
  while ((branchMatch = branchRegex.exec(xmlContent)) !== null) {
    config.branches.push(parseBranch(branchMatch[1]));
  }

  return config;
}

export async function parseFitsDirectory(): Promise<MainData> {
  const mainData: MainData = {
    name: { en: '', zh: '' },
    collections: [],
    footer: { en: '', zh: '' },
  };

  try {
    const mainResponse = await fetch('/fits/_main.xml');
    const mainXml = await mainResponse.text();
    mainData.name = parseRootLocaleText(mainXml, 'name');
    mainData.footer = parseRootLocaleText(mainXml, 'footer');
  } catch (e) {
    console.error('Failed to load _main.xml:', e);
    mainData.name = { en: 'EXCT Fits', zh: '精密配置' };
    mainData.footer = { en: '', zh: '' };
  }

  const collectionDirs = ['incursion'];

  for (const collectionName of collectionDirs) {
    const collection: Collection = {
      url: '',
      name: { en: '', zh: '' },
      description: { en: '', zh: '' },
      series: [],
    };

    try {
      const collectionResponse = await fetch(`/fits/${collectionName}/_collection.xml`);
      const collectionXml = await collectionResponse.text();
      const urlMatch = collectionXml.match(/<url>([^<]+)<\/url>/);
      if (urlMatch) collection.url = urlMatch[1].trim();
      collection.name = parseRootLocaleText(collectionXml, 'name');
      collection.description = parseRootLocaleText(collectionXml, 'description');
    } catch (e) {
      console.error(`Failed to load ${collectionName}/_collection.xml:`);
      collection.url = collectionName;
      collection.name = { en: collectionName, zh: collectionName };
      collection.description = { en: '', zh: '' };
    }

    const seriesDirs = ['EXCT', 'TLA'];

    for (const seriesName of seriesDirs) {
      const series: Series = {
        url: '',
        name: { en: '', zh: '' },
        description: { en: '', zh: '' },
        configs: [],
      };

      try {
        const seriesResponse = await fetch(`/fits/${collectionName}/${seriesName}/_series.xml`);
        const seriesXml = await seriesResponse.text();
        const urlMatch = seriesXml.match(/<url>([^<]+)<\/url>/);
        if (urlMatch) series.url = urlMatch[1].trim();
        series.name = parseRootLocaleText(seriesXml, 'name');
        series.description = parseRootLocaleText(seriesXml, 'description');
      } catch (e) {
        console.error(`Failed to load ${collectionName}/${seriesName}/_series.xml:`);
        series.url = seriesName;
        series.name = { en: seriesName, zh: seriesName };
        series.description = { en: '', zh: '' };
      }

      const configFiles = ['apoc.xml', 'nestor.xml'];

      for (const configFile of configFiles) {
        try {
          const configResponse = await fetch(`/fits/${collectionName}/${seriesName}/${configFile}`);
          const configXml = await configResponse.text();
          const config = parseConfigFile(configXml);
          series.configs.push(config);
        } catch (e) {
          console.error(`Failed to load ${collectionName}/${seriesName}/${configFile}:`);
        }
      }

      if (series.configs.length > 0) {
        collection.series.push(series);
      }
    }

    if (collection.series.length > 0) {
      mainData.collections.push(collection);
    }
  }

  return mainData;
}
