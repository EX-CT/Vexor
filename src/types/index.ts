export interface LocaleText {
  en: string;
  zh: string;
}

export interface FitItem {
  name: string;
  ammo?: string;
  ammoQuantity?: number;
  alternatives?: string[];
  offline?: boolean;
  quantity?: number;
}

export interface FitEquipment {
  low: FitItem[];
  med: FitItem[];
  high: FitItem[];
  rig: FitItem[];
  drone: FitItem[];
  cargo: FitItem[];
  imp?: FitItem[];
  sub?: FitItem[];
}

export interface FitSection {
  shipName: string;
  equipment: FitEquipment;
}

export interface Branch {
  name: LocaleText;
  alert?: LocaleText;
  note?: LocaleText;
  fits: FitSection[];
}

export interface FitConfig {
  url: string;
  name: LocaleText;
  description: LocaleText;
  branches: Branch[];
}

export interface Series {
  url: string;
  name: LocaleText;
  description: LocaleText;
  configs: FitConfig[];
}

export interface Collection {
  url: string;
  name: LocaleText;
  description: LocaleText;
  series: Series[];
}

export interface MainData {
  name: LocaleText;
  footer: LocaleText;
  collections: Collection[];
}

export interface SDEItem {
  _key: number;
  groupID: number;
  name: {
    de: string;
    en: string;
    es: string;
    fr: string;
    ja: string;
    ko: string;
    ru: string;
    zh: string;
  };
  iconID?: number;
  description?: {
    de: string;
    en: string;
    es: string;
    fr: string;
    ja: string;
    ko: string;
    ru: string;
    zh: string;
  };
}
