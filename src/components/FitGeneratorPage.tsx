import { useState, useMemo, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Plus, Copy, Check, AlertTriangle } from 'lucide-react';
import type { LocaleText } from '../types';

interface BranchForm {
  bname: { en: string; zh: string };
  note: { en: string; zh: string };
  alert: { en: string; zh: string };
  versions: VersionForm[];
}

interface VersionForm {
  version: string;
  eft: string;
}

export default function FitGeneratorPage() {
  const { lang } = useLanguage();
  const [url, setUrl] = useState('');
  const [fitName, setFitName] = useState({ en: '', zh: '' });
  const [description, setDescription] = useState({ en: '', zh: '' });
  const [branches, setBranches] = useState<BranchForm[]>([{
    bname: { en: 'Main', zh: '主线' },
    note: { en: '', zh: '' },
    alert: { en: '', zh: '' },
    versions: [{ version: '1', eft: '' }],
  }]);
  const [activeBranch, setActiveBranch] = useState(0);
  const [copied, setCopied] = useState(false);

  const t = useCallback((obj: LocaleText) => lang === 'zh' ? (obj.zh || obj.en) : obj.en, [lang]);

  // Pure function - no side effects
  function parseEFT(text: string): { shipName: string; sections: Record<string, string[]>; fitNameFromEFT: string } | null {
    const lines = text.split('\n');
    const trimmedLines: string[] = [];
    for (const line of lines) {
      const tl = line.trimEnd();
      trimmedLines.push(tl !== '' ? tl : '');
    }

    let lineIdx = 0;
    while (lineIdx < trimmedLines.length && trimmedLines[lineIdx] === '') lineIdx++;
    if (lineIdx >= trimmedLines.length) return null;

    const firstLine = trimmedLines[lineIdx].trim();
    if (!firstLine.startsWith('[') || !firstLine.endsWith(']')) return null;

    const header = firstLine.slice(1, -1);
    const parts = header.split(',').map(p => p.trim());
    const shipName = parts[0] || '';
    const fitNameFromEFT = parts[1] || '';

    // Check if this is labeled EFT (has [low], [med] etc.) or unlabeled (blank-line separated)
    let hasLabels = false;
    for (let i = lineIdx + 1; i < trimmedLines.length; i++) {
      const line = trimmedLines[i].trim();
      if (line.match(/^\[(low|med|high|rig|drone|cargo|imp|sub|service)\]$/i)) {
        hasLabels = true;
        break;
      }
    }

    const sections: Record<string, string[]> = {};

    if (hasLabels) {
      // Labeled format: [low], [med], [high], etc.
      let currentSection: string | null = null;
      for (let i = lineIdx + 1; i < trimmedLines.length; i++) {
        if (trimmedLines[i] === '') continue;
        const line = trimmedLines[i].trim();
        const sectionMatch = line.match(/^\[(.+)\]$/);
        if (sectionMatch) {
          currentSection = sectionMatch[1].trim().toLowerCase();
          if (!sections[currentSection]) sections[currentSection] = [];
          continue;
        }
        if (currentSection && line) {
          sections[currentSection].push(line);
        }
      }
    } else {
      // Unlabeled EFT format: sections separated by blank lines
      // Order: low -> med -> high -> rig -> drone, then remaining: imp (if 2+) then cargo, or all cargo
      const fixedOrder = ['low', 'med', 'high', 'rig', 'drone'];
       let currentBlock: string[] = [];
      const blocks: string[][] = [];

      // Collect all blocks first
      for (let i = lineIdx + 1; i < trimmedLines.length; i++) {
        if (trimmedLines[i] === '') {
          if (currentBlock.length > 0) {
            blocks.push(currentBlock);
            currentBlock = [];
          }
          continue;
        }
        const line = trimmedLines[i].trim();
        if (line && !line.match(/^\[.+\]$/)) {
          currentBlock.push(line);
        }
      }
      if (currentBlock.length > 0) {
        blocks.push(currentBlock);
      }

      // Assign blocks to sections
      for (let bi = 0; bi < blocks.length; bi++) {
        if (bi < fixedOrder.length) {
          sections[fixedOrder[bi]] = blocks[bi];
        } else {
          // Remaining blocks after drone
          const remainingCount = blocks.length - fixedOrder.length;
          if (remainingCount >= 2 && bi === fixedOrder.length) {
            // First remaining block → imp
            sections['imp'] = blocks[bi];
          } else {
            // All remaining blocks (including single remaining) → cargo
            if (!sections['cargo']) sections['cargo'] = [];
            sections['cargo'] = sections['cargo'].concat(blocks[bi]);
          }
        }
      }
    }

    return { shipName, sections, fitNameFromEFT };
  }

  function generateXML(): string {
    if (!fitName.en && !fitName.zh) return '';

    let hasContent = false;
    for (const branch of branches) {
      for (const v of branch.versions) {
        if (v.eft.trim()) { hasContent = true; break; }
      }
    }
    if (!hasContent) return '';

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<root>\n';
    xml += `  <url>${url || 'unnamed'}</url>\n`;
    xml += '\n';
    xml += `  <name lang="en">${(fitName.en || fitName.zh).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</name>\n`;
    xml += `  <name lang="zh">${(fitName.zh || fitName.en).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</name>\n`;
    xml += '\n';
    if (description.en || description.zh) {
      xml += `  <description lang="en">${(description.en || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</description>\n`;
      xml += `  <description lang="zh">${(description.zh || description.en || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</description>\n`;
      xml += '\n';
    }

    for (const branch of branches) {
      const hasBranchContent = branch.versions.some(v => v.eft.trim());
      if (!hasBranchContent) continue;

      xml += '  <branch>\n';
      xml += `    <bname lang="en">${branch.bname.en.replace(/&/g, '&amp;')}</bname>\n`;
      xml += `    <bname lang="zh">${branch.bname.zh.replace(/&/g, '&amp;')}</bname>\n`;
      if (branch.note.en || branch.note.zh) {
        xml += `    <note lang="en">${branch.note.en.replace(/&/g, '&amp;')}</note>\n`;
        xml += `    <note lang="zh">${(branch.note.zh || branch.note.en).replace(/&/g, '&amp;')}</note>\n`;
      }
      if (branch.alert.en || branch.alert.zh) {
        xml += `    <alert lang="en">${branch.alert.en.replace(/&/g, '&amp;')}</alert>\n`;
        xml += `    <alert lang="zh">${(branch.alert.zh || branch.alert.en).replace(/&/g, '&amp;')}</alert>\n`;
      }
      xml += '\n';

      for (const v of branch.versions) {
        if (!v.eft.trim()) continue;
        xml += `    <fit version="${v.version}">\n`;
        const parsed = parseEFT(v.eft);
        if (parsed) {
          const { shipName, sections } = parsed;
          xml += `      [${shipName}]\n`;
          const sectionOrder = ['low', 'med', 'high', 'rig', 'drone', 'imp', 'cargo'];
          for (const section of sectionOrder) {
            if (sections[section] && sections[section].length > 0) {
              xml += `      [${section}]\n`;
              for (const item of sections[section]) {
                xml += `      ${item}\n`;
              }
            }
          }
        }
        xml += '    </fit>\n';
      }
      xml += '  </branch>\n';
    }
    xml += '</root>';
    return xml;
  }

  const handlePasteEFT = useCallback((branchIdx: number, versionIdx: number, text: string) => {
    setBranches(prev => {
      const next = [...prev];
      next[branchIdx] = { ...next[branchIdx], versions: [...next[branchIdx].versions] };
      next[branchIdx].versions[versionIdx] = { ...next[branchIdx].versions[versionIdx], eft: text };
      return next;
    });
    // Auto-fill
    const parsed = parseEFT(text);
    if (parsed && parsed.fitNameFromEFT) {
      setUrl(prev => prev || parsed.fitNameFromEFT.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
      setFitName(prev => prev.en ? prev : { ...prev, en: parsed.fitNameFromEFT });
    }
  }, []);

  const addBranch = useCallback(() => {
    setBranches(prev => [...prev, {
      bname: { en: 'Main', zh: '主线' },
      note: { en: '', zh: '' },
      alert: { en: '', zh: '' },
      versions: [{ version: '1', eft: '' }],
    }]);
    setActiveBranch(branches.length);
  }, [branches.length]);

  const removeBranch = useCallback((idx: number) => {
    if (branches.length <= 1) return;
    setBranches(prev => prev.filter((_, i) => i !== idx));
    setActiveBranch(prev => Math.min(prev, branches.length - 2));
  }, [branches.length]);

  const addVersion = useCallback((branchIdx: number) => {
    setBranches(prev => {
      const next = [...prev];
      next[branchIdx] = { ...next[branchIdx], versions: [...next[branchIdx].versions] };
      next[branchIdx].versions.push({ version: String(next[branchIdx].versions.length + 1), eft: '' });
      return next;
    });
  }, []);

  const removeVersion = useCallback((branchIdx: number, versionIdx: number) => {
    setBranches(prev => {
      const next = [...prev];
      next[branchIdx] = { ...next[branchIdx], versions: next[branchIdx].versions.filter((_, i) => i !== versionIdx) };
      return next;
    });
  }, []);

  const updateBranchField = useCallback((branchIdx: number, field: 'bname' | 'note' | 'alert', langField: 'en' | 'zh', value: string) => {
    setBranches(prev => {
      const next = [...prev];
      next[branchIdx] = { ...next[branchIdx], [field]: { ...next[branchIdx][field], [langField]: value } };
      return next;
    });
  }, []);

  // Real-time XML - pure computation, no side effects
  const generatedXML = useMemo(() => generateXML(), [fitName, description, branches, url]);

  const handleCopy = useCallback(async () => {
    if (!generatedXML) return;
    try {
      await navigator.clipboard.writeText(generatedXML);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = generatedXML;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [generatedXML]);

  return (
    <div className="h-full flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Main content: Left / Right split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Form */}
        <div className="w-1/2 min-w-0 overflow-y-auto border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="p-4 space-y-5">
            {/* Basic Info */}
            <div>
              <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                {t({ en: 'Basic Info', zh: '基本信息' })}
              </h2>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {t({ en: 'URL (path segment)', zh: 'URL (网址段)' })}
                  </label>
                  <input type="text" value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="my-fit"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {t({ en: 'Name (EN)', zh: '名称 (英文)' })}
                  </label>
                  <input type="text" value={fitName.en}
                    onChange={e => setFitName(p => ({ ...p, en: e.target.value }))}
                    placeholder="My Fit"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {t({ en: 'Name (ZH)', zh: '名称 (中文)' })}
                  </label>
                  <input type="text" value={fitName.zh}
                    onChange={e => setFitName(p => ({ ...p, zh: e.target.value }))}
                    placeholder="我的配置"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none" />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                {t({ en: 'Description', zh: '描述' })}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <textarea value={description.en}
                    onChange={e => setDescription(p => ({ ...p, en: e.target.value }))}
                    rows={2}
                    placeholder="English description"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none resize-none" />
                </div>
                <div>
                  <textarea value={description.zh}
                    onChange={e => setDescription(p => ({ ...p, zh: e.target.value }))}
                    rows={2}
                    placeholder="中文描述"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none resize-none" />
                </div>
              </div>
            </div>

            {/* Branches */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  {t({ en: 'Branches', zh: '分支' })}
                </h2>
                <button onClick={addBranch}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-violet-500 hover:bg-violet-600 text-white rounded-lg transition-colors">
                  <Plus className="w-3 h-3" /> {t({ en: 'Add Branch', zh: '添加分支' })}
                </button>
              </div>

              {/* Branch tabs */}
              <div className="flex gap-1 mb-3 flex-wrap">
                {branches.map((branch, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <button
                      onClick={() => setActiveBranch(idx)}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        activeBranch === idx
                          ? 'bg-violet-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {t(branch.bname)}
                    </button>
                    {branches.length > 1 && (
                      <button onClick={() => removeBranch(idx)}
                        className="p-0.5 text-gray-400 hover:text-red-500 transition-colors">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Active branch form */}
              {branches[activeBranch] && (
                <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {t({ en: 'Branch Name (EN)', zh: '分支名 (英文)' })}
                      </label>
                      <input type="text" value={branches[activeBranch].bname.en}
                        onChange={e => updateBranchField(activeBranch, 'bname', 'en', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {t({ en: 'Branch Name (ZH)', zh: '分支名 (中文)' })}
                      </label>
                      <input type="text" value={branches[activeBranch].bname.zh}
                        onChange={e => updateBranchField(activeBranch, 'bname', 'zh', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none" />
                    </div>
                    <div></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {t({ en: 'Note (EN)', zh: '备注 (英文)' })}
                      </label>
                      <input type="text" value={branches[activeBranch].note.en}
                        onChange={e => updateBranchField(activeBranch, 'note', 'en', e.target.value)}
                        placeholder="Expensive"
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {t({ en: 'Note (ZH)', zh: '备注 (中文)' })}
                      </label>
                      <input type="text" value={branches[activeBranch].note.zh}
                        onChange={e => updateBranchField(activeBranch, 'note', 'zh', e.target.value)}
                        placeholder="昂贵的精英版本"
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {t({ en: 'Alert (EN)', zh: '提醒 (英文)' })}
                      </label>
                      <input type="text" value={branches[activeBranch].alert.en}
                        onChange={e => updateBranchField(activeBranch, 'alert', 'en', e.target.value)}
                        placeholder="3 repair on!"
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {t({ en: 'Alert (ZH)', zh: '提醒 (中文)' })}
                      </label>
                      <input type="text" value={branches[activeBranch].alert.zh}
                        onChange={e => updateBranchField(activeBranch, 'alert', 'zh', e.target.value)}
                        placeholder="要求3摇修永动！"
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none" />
                    </div>
                  </div>

                  {/* Versions */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {t({ en: 'Versions (EFT Format)', zh: '版本 (EFT 格式)' })}
                      </span>
                      <button onClick={() => addVersion(activeBranch)}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg transition-colors">
                        <Plus className="w-3 h-3" /> {t({ en: 'Add Version', zh: '添加版本' })}
                      </button>
                    </div>

                    {branches[activeBranch].versions.map((v, vi) => (
                      <div key={vi} className="mb-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-gray-400">v{v.version}</span>
                          {branches[activeBranch].versions.length > 1 && (
                            <button onClick={() => removeVersion(activeBranch, vi)}
                              className="text-xs text-red-400 hover:text-red-600 transition-colors">
                              {t({ en: 'remove', zh: '删除' })}
                            </button>
                          )}
                        </div>
                        <textarea
                          value={v.eft}
                          onChange={e => handlePasteEFT(activeBranch, vi, e.target.value)}
                          rows={6}
                          placeholder={`[Kronos, TLA Kronos]\n\nFederation Navy Magnetic Field Stabilizer\nFederation Navy Magnetic Field Stabilizer\n...\n\nLarge Micro Jump Drive\nGist X-Type 500MN Microwarpdrive\n...\n\nNeutron Blaster Cannon II, Void L\nNeutron Blaster Cannon II, Void L\n...\n\nLarge Trimark Armor Pump II\nLarge Hybrid Burst Aerator II\n\n\nHigh-grade Ascendancy Alpha\n...\n\nNull L x20000\nVoid L x20000`}
                          className="w-full px-3 py-2 font-mono text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none resize-y"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: XML Preview */}
        <div className="w-1/2 min-w-0 flex flex-col bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t({ en: 'XML Preview', zh: 'XML 预览' })}
              </h2>
              <span className="text-xs text-gray-400">
                {generatedXML ? `${(generatedXML.length / 1024).toFixed(1)} KB` : ''}
              </span>
            </div>
            {generatedXML && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-violet-500 hover:bg-violet-600 text-white rounded-lg transition-colors"
              >
                {copied ? (
                  <><Check className="w-4 h-4" /> {t({ en: 'Copied!', zh: '已复制!' })}</>
                ) : (
                  <><Copy className="w-4 h-4" /> {t({ en: 'Copy XML', zh: '复制 XML' })}</>
                )}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-auto p-4">
            {generatedXML ? (
              <pre className="text-xs leading-relaxed text-gray-800 dark:text-gray-200 font-mono whitespace-pre-wrap break-all">
                {generatedXML.split('\n').map((line, i) => {
                  let className = '';
                  if (line.includes('<?xml') || line.includes('</root>') || line.match(/<\/?\w+>/)) {
                    if (line.includes('lang=')) className = 'text-blue-600 dark:text-blue-400';
                    else if (line.match(/^<\w/)) className = 'text-violet-600 dark:text-violet-400';
                    else if (line.match(/^<\/\w/)) className = 'text-violet-600 dark:text-violet-400';
                    else className = 'text-violet-600 dark:text-violet-400';
                  } else if (line.includes('[') && line.includes(']')) {
                    className = 'text-green-600 dark:text-green-400 font-semibold';
                  }
                  return (
                    <div key={i} className={className}>
                      {line || '\u00A0'}
                    </div>
                  );
                })}
              </pre>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                <div className="text-center">
                  <Copy className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">{t({ en: 'Fill in the form on the left to see XML preview', zh: '填写左侧表单即可查看 XML 预览' })}</p>
                </div>
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-700 dark:text-amber-300 space-y-1 mx-4 mb-4">
            <div className="flex items-center gap-2 mb-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <span className="font-semibold text-amber-800 dark:text-amber-200">{t({ en: 'Tips', zh: '提示' })}</span>
            </div>
            <div>• {t({ en: 'For config creators only. Generated slot sections need manual adjustment.', zh: '本页面只供配置创建者使用，工具生成的槽位信息需要自己调整' })}</div>
            <div>• {t({ en: 'Use == to specify module alternatives', zh: '配置中 == 号可以表示装备替代' })}</div>
            <div>• {t({ en: 'Use # after module name to mark it offline', zh: '装备后面打 # 号表示装备离线' })}</div>
          </div>
        </div>
      </div>
    </div>
  );
}