import fs from 'fs';
import path from 'path';

const fitsDir = path.join(process.cwd(), 'fits');
const sdeFile = path.join(process.cwd(), 'sde', 'types.jsonl');
const outputDir = path.join(process.cwd(), 'src', 'data');
const outputFile = path.join(outputDir, 'sdeData.ts');

// 递归获取所有 XML 文件
function getAllXmlFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getAllXmlFiles(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith('.xml')) {
      files.push(fullPath);
    }
  }
  return files;
}

// 从 XML 中提取装备名称
function extractItemNames(xmlContent) {
  const itemNames = new Set();

  // 提取 [fit] 块中的内容
  const fitRegex = /<fit[^>]*>([\s\S]*?)<\/fit>/gi;
  let fitMatch;

  while ((fitMatch = fitRegex.exec(xmlContent)) !== null) {
    const fitContent = fitMatch[1];
    const lines = fitContent.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // 提取船名（方括号中的内容）
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        const shipName = trimmed.slice(1, -1).trim();
        if (shipName && !shipName.toLowerCase().includes('slot')) {
          itemNames.add(shipName);
        }
        continue;
      }

      // 提取装备名称（忽略数量、弹药、替代项等）
      let itemName = trimmed;

      // 移除离线标记
      if (itemName.endsWith('#')) {
        itemName = itemName.slice(0, -1).trim();
      }

      // 移除替代项
      itemName = itemName.split('==')[0].trim();

      // 移除弹药
      itemName = itemName.split(',')[0].trim();

      // 移除数量
      const match = itemName.match(/^(.+?)\s+x\d+$/i);
      if (match) {
        itemName = match[1].trim();
      }

      if (itemName) {
        itemNames.add(itemName);
      }
    }
  }

  return itemNames;
}

// 从 SDE 数据中提取需要的装备
function extractSDEItems(sdeLines, itemNames) {
  const sdeItems = [];
  const nameMap = new Map();

  for (const line of sdeLines) {
    try {
      const item = JSON.parse(line);
      const itemName = item.name?.en;

      if (itemName && itemNames.has(itemName)) {
        sdeItems.push(item);
        nameMap.set(itemName.toLowerCase(), item._key);
      }
    } catch {
      continue;
    }
  }

  return { sdeItems, nameMap };
}

function compileSDE() {
  console.log('Extracting item names from XML files...');

  // 获取所有 XML 文件
  const xmlFiles = getAllXmlFiles(fitsDir);
  console.log(`Found ${xmlFiles.length} XML files`);

  // 提取所有装备名称
  const allItemNames = new Set();
  for (const xmlFile of xmlFiles) {
    const xmlContent = fs.readFileSync(xmlFile, 'utf-8');
    const itemNames = extractItemNames(xmlContent);
    itemNames.forEach(name => allItemNames.add(name));
  }

  console.log(`Found ${allItemNames.size} unique items`);

  // 读取 SDE 数据
  console.log('Reading SDE data...');
  const sdeContent = fs.readFileSync(sdeFile, 'utf-8');
  const sdeLines = sdeContent.split('\n').filter(line => line.trim());

  console.log(`SDE file has ${sdeLines.length} entries`);

  // 提取需要的装备
  console.log('Extracting required items from SDE...');
  const { sdeItems, nameMap } = extractSDEItems(sdeLines, allItemNames);

  console.log(`Extracted ${sdeItems.length} items (${Math.round(sdeItems.length / sdeLines.length * 100)}% of SDE)`);

  // 创建输出目录
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 生成 TypeScript 文件
  const content = `import type { SDEItem } from '../types';

export const sdeData: SDEItem[] = ${JSON.stringify(sdeItems, null, 2)};

export const sdeNameToId: Record<string, number> = ${JSON.stringify(Object.fromEntries(nameMap), null, 2)};
`;

  fs.writeFileSync(outputFile, content);
  console.log(`SDE data compiled to ${outputFile}`);
  console.log(`Original SDE size: ${(sdeContent.length / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Compiled SDE size: ${(content.length / 1024 / 1024).toFixed(2)} MB`);
}

compileSDE();