import fs from 'fs';
import path from 'path';

const fitsDir = path.join(process.cwd(), 'fits');
const outputDir = path.join(process.cwd(), 'src', 'data');
const outputFile = path.join(outputDir, 'fitsData.ts');

function parseLocaleText(xmlContent, tagName) {
    const result = { en: '', zh: '' };
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

function extractRootContent(xmlContent) {
    const match = xmlContent.match(/<root>([\s\S]*)<\/root>/);
    return match ? match[1].trim() : xmlContent;
}

function parseRootLocaleText(xmlContent, tagName) {
    const result = { en: '', zh: '' };
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

function parseFitItem(line) {
    const item = { name: '' };
    let remaining = line.trim();
    if (remaining.endsWith('#')) {
        item.offline = true;
        remaining = remaining.slice(0, -1).trim();
    }
    const parts = remaining.split('==');
    const mainPart = parts[0];
    const commaParts = mainPart.split(',');
    const equipmentPart = commaParts[0].trim();
    const ammoPart = commaParts.length > 1 ? commaParts.slice(1).join(',').trim() : null;
    const equipMatch = equipmentPart.match(/^(.+?)\s+x(\d+)$/i);
    if (equipMatch) {
        item.name = equipMatch[1].trim();
        item.quantity = parseInt(equipMatch[2], 10);
    } else {
        item.name = equipmentPart;
    }
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

function parseFitSection(fitContent) {
    const equipment = {
        low: [],
        med: [],
        high: [],
        rig: [],
        drone: [],
        cargo: [],
    };
    let shipName = '';
    const sections = ['low', 'med', 'high', 'rig', 'drone', 'cargo', 'imp', 'sub'];
    let currentSection = null;
    const lines = fitContent.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const bracketMatch = trimmed.match(/^\[([^\]]+)\]$/);
        if (bracketMatch) {
            const content = bracketMatch[1].toLowerCase();
            if (sections.includes(content)) {
                currentSection = content;
            } else {
                shipName = bracketMatch[1].trim();
            }
            continue;
        }
        if (currentSection && trimmed && !trimmed.startsWith('[')) {
            if (!equipment[currentSection]) {
                equipment[currentSection] = [];
            }
            equipment[currentSection].push(parseFitItem(trimmed));
        }
    }
    return { shipName, equipment };
}

function parseBranch(branchContent) {
    const branch = {
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

function parseConfigFile(xmlContent) {
    const config = {
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

function compileFits() {
    const mainData = {
        name: { en: '', zh: '' },
        collections: [],
        footer: { en: '', zh: '' },
    };

    if (fs.existsSync(path.join(fitsDir, '_main.xml'))) {
        const mainXml = fs.readFileSync(path.join(fitsDir, '_main.xml'), 'utf-8');
        mainData.name = parseRootLocaleText(mainXml, 'name');
        mainData.footer = parseRootLocaleText(mainXml, 'footer');
    } else {
        mainData.name = { en: 'EXCT Fits', zh: '精密配置' };
        mainData.footer = { en: '', zh: '' };
    }

    const collectionDirs = fs.readdirSync(fitsDir).filter(dir => {
        const dirPath = path.join(fitsDir, dir);
        return fs.statSync(dirPath).isDirectory() && !dir.startsWith('.');
    });

    for (const collectionName of collectionDirs) {
        const collection = {
            url: '',
            name: { en: '', zh: '' },
            description: { en: '', zh: '' },
            series: [],
        };

        const collectionXmlPath = path.join(fitsDir, collectionName, '_collection.xml');
        if (fs.existsSync(collectionXmlPath)) {
            const collectionXml = fs.readFileSync(collectionXmlPath, 'utf-8');
            const urlMatch = collectionXml.match(/<url>([^<]+)<\/url>/);
            if (urlMatch) collection.url = urlMatch[1].trim();
            collection.name = parseRootLocaleText(collectionXml, 'name');
            collection.description = parseRootLocaleText(collectionXml, 'description');
        } else {
            collection.url = collectionName;
            collection.name = { en: collectionName, zh: collectionName };
            collection.description = { en: '', zh: '' };
        }

        const seriesDirs = fs.readdirSync(path.join(fitsDir, collectionName)).filter(dir => {
            const dirPath = path.join(fitsDir, collectionName, dir);
            return fs.statSync(dirPath).isDirectory() && !dir.startsWith('.');
        });

        for (const seriesName of seriesDirs) {
            const series = {
                url: '',
                name: { en: '', zh: '' },
                description: { en: '', zh: '' },
                configs: [],
            };

            const seriesXmlPath = path.join(fitsDir, collectionName, seriesName, '_series.xml');
            if (fs.existsSync(seriesXmlPath)) {
                const seriesXml = fs.readFileSync(seriesXmlPath, 'utf-8');
                const urlMatch = seriesXml.match(/<url>([^<]+)<\/url>/);
                if (urlMatch) series.url = urlMatch[1].trim();
                series.name = parseRootLocaleText(seriesXml, 'name');
                series.description = parseRootLocaleText(seriesXml, 'description');
            } else {
                series.url = seriesName;
                series.name = { en: seriesName, zh: seriesName };
                series.description = { en: '', zh: '' };
            }

            const configFiles = fs.readdirSync(path.join(fitsDir, collectionName, seriesName)).filter(file => {
                return file.endsWith('.xml') && !file.startsWith('_');
            });

            for (const configFile of configFiles) {
                const configXmlPath = path.join(fitsDir, collectionName, seriesName, configFile);
                const configXml = fs.readFileSync(configXmlPath, 'utf-8');
                const config = parseConfigFile(configXml);
                series.configs.push(config);
            }

            if (series.configs.length > 0) {
                collection.series.push(series);
            }
        }

        if (collection.series.length > 0) {
            mainData.collections.push(collection);
        }
    }

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const content = `import type { MainData } from '../types';

export const fitsData: MainData = ${JSON.stringify(mainData, null, 2)};
`;

    fs.writeFileSync(outputFile, content);
    console.log(`Fits data compiled to ${outputFile}`);
}

compileFits();