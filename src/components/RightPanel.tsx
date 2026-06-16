import { useState, useRef } from 'react';
import { AlertTriangle, Info, Copy, Share2, X, Camera, ChevronRight, ChevronLeft } from 'lucide-react';
import domtoimage from 'dom-to-image-more';
import { useLanguage } from '../context/LanguageContext';
import { getItemByName, getItemIconUrlFromSDEItem } from '../utils/sdeLoader';
import { convertFitToEFT } from '../utils/eftConverter';
import { EquipmentSection } from './EquipmentSection';
import { ScreenshotPreview } from './ScreenshotPreview';
import type { FitConfig, Branch } from '../types';

interface RightPanelProps {
  shipName: string;
  lang: 'en' | 'zh';
  collectionName: string;
  seriesName: string;
  currentConfig: FitConfig;
  currentBranch: Branch;
  selectedBranchIndex: number;
  selectedFitIndex: number;
  onBranchChange: (index: number) => void;
  onFitIndexChange: (index: number) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  alternativeSelections: Record<string, number>;
  onAlternativeChange: (selectionKey: string, value: number) => void;
}

export function RightPanel({
  shipName,
  lang,
  collectionName,
  seriesName,
  currentConfig,
  currentBranch,
  selectedBranchIndex,
  selectedFitIndex,
  onBranchChange,
  onFitIndexChange,
  collapsed,
  onToggleCollapse,
  alternativeSelections,
  onAlternativeChange,
}: RightPanelProps) {
  const { t } = useLanguage();
  const shipSdeItem = getItemByName(shipName);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [exportContent, setExportContent] = useState('');
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [screenshotImage, setScreenshotImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const screenshotRef = useRef<HTMLDivElement>(null);

  const currentFit = currentBranch.fits[selectedFitIndex];

  const getEFTContent = () => {
    if (!currentFit) return '';
    return convertFitToEFT(
      currentFit,
      `${t(currentConfig.name)} - ${t(currentBranch.name)}`,
      alternativeSelections
    );
  };

  const handleCopy = async () => {
    const eftContent = getEFTContent();
    if (!eftContent) return;
    
    try {
      await navigator.clipboard.writeText(eftContent);
      setCopySuccess('eft');
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleExport = () => {
    const eftContent = getEFTContent();
    if (!eftContent) return;
    setExportContent(eftContent);
    setShowExportModal(true);
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess('share');
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleScreenshot = async () => {
    setShowScreenshotModal(true);
    setIsGenerating(true);
    setScreenshotImage(null);

    await new Promise(resolve => setTimeout(resolve, 500));

    if (screenshotRef.current) {
      await new Promise(resolve => requestAnimationFrame(resolve));

      try {
        const imageData = await domtoimage.toPng(screenshotRef.current, {
          quality: 1,
          cacheBust: true,
          scale: 2,
        });
        setScreenshotImage(imageData);
      } catch (err) {
        console.error('Failed to generate screenshot:', err);
        setScreenshotImage(null);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const handleModalCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportContent);
      setCopySuccess('eft');
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <>
    <aside className={`${collapsed ? 'w-12' : 'w-72'} bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-hidden flex-shrink-0 transition-all duration-300 flex flex-col relative`}>
      {/* 收回/展开按钮 */}
      <button
        onClick={onToggleCollapse}
        className={`absolute top-2 ${collapsed ? 'right-0' : 'right-2'} p-2 bg-violet-100 dark:bg-violet-900/50 hover:bg-violet-200 dark:hover:bg-violet-900/70 border border-violet-200 dark:border-violet-800 rounded-lg flex items-center justify-center transition-all duration-300 shadow-sm z-10`}
      >
        {collapsed ? (
          <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        )}
      </button>
      
      <div className={`w-72 h-full p-4 overflow-y-auto ${collapsed ? 'invisible' : 'visible'}`}>
        {/* 舰船信息 */}
        <div className="flex items-center gap-3 mb-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          {shipSdeItem && (
            <img
              src={getItemIconUrlFromSDEItem(shipSdeItem, 1024)}
              alt={shipName}
              className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-600"
            />
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 truncate">
              {lang === 'zh' ? (shipSdeItem?.name.zh || shipName) : shipName}
            </h2>
            {shipSdeItem && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{shipSdeItem.name.en}</p>
            )}
          </div>
        </div>

        {/* Branch 选择 + 版本选择 */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-3">
          <div className="flex flex-wrap gap-1.5 items-center mb-2">
            {currentConfig.branches.map((branch, index) => (
              <button
                key={index}
                onClick={() => onBranchChange(index)}
                className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                  selectedBranchIndex === index
                    ? 'bg-violet-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                }`}
              >
                {t(branch.name)}
              </button>
            ))}
            {currentBranch.note && (
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg px-2 py-1.5 flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300">{t(currentBranch.note)}</p>
              </div>
            )}
          </div>
          
          {currentBranch.fits.length > 1 && (
            <select
              value={selectedFitIndex}
              onChange={(e) => onFitIndexChange(Number(e.target.value))}
              className="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400 focus:border-transparent text-gray-800 dark:text-gray-100"
            >
              {currentBranch.fits.map((_, index) => (
                <option key={index} value={index}>
                  {t({ en: 'Version', zh: '版本' })} {index + 1}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* 描述信息 */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-2">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-2">
            <Info className="w-4 h-4" />
            {t({ en: 'Description', zh: '描述' })}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">{t(currentConfig.description)}</p>
        </div>

        {/* Alert 信息 */}
        {currentBranch.alert && (
          <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-2">
            <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {t({ en: 'Alert', zh: '注意' })}
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300">{t(currentBranch.alert)}</p>
          </div>
        )}

        {/* 工具栏 */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-2">
          <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-2">
            {t({ en: 'Actions', zh: '操作' })}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopy}
              className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg transition-colors ${
                copySuccess === 'eft'
                  ? 'bg-green-100 dark:bg-green-900/50 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300'
                  : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
              }`}
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="text-xs">{copySuccess === 'eft' ? t({ en: 'Copied!', zh: '已复制!' }) : t({ en: 'Copy EFT', zh: '复制EFT' })}</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-1 px-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-200"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="text-xs">{t({ en: 'Export', zh: '导出' })}</span>
            </button>
            <button
              onClick={handleShare}
              className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg transition-colors ${
                copySuccess === 'share'
                  ? 'bg-green-100 dark:bg-green-900/50 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300'
                  : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="text-xs">{copySuccess === 'share' ? t({ en: 'Copied!', zh: '已复制!' }) : t({ en: 'Share Link', zh: '分享链接' })}</span>
            </button>
            <button
              onClick={handleScreenshot}
              className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg transition-colors ${
                copySuccess === 'screenshot'
                  ? 'bg-green-100 dark:bg-green-900/50 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300'
                  : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="text-xs">{copySuccess === 'screenshot' ? t({ en: 'Done!', zh: '已完成!' }) : t({ en: 'Screenshot', zh: '截图' })}</span>
            </button>
          </div>
        </div>

        {/* 植入体 */}
        {currentBranch.fits[selectedFitIndex]?.equipment.imp && (
          <EquipmentSection
            keyName="imp"
            label={{ en: 'Implants', zh: '植入体' }}
            items={currentBranch.fits[selectedFitIndex].equipment.imp}
            isExpanded={true}
            onToggle={() => {}}
            alternativeSelections={alternativeSelections}
            onAlternativeChange={onAlternativeChange}
          />
        )}
      </div>
    </aside>

    {/* 导出弹窗 - 全屏毛玻璃效果 */}
    {showExportModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-md"
          onClick={() => setShowExportModal(false)}
        />
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* 头部 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {t({ en: 'Export EFT', zh: '导出 EFT' })}
            </h3>
            <button
              onClick={() => setShowExportModal(false)}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* 内容区域 */}
          <div className="p-4 overflow-y-auto max-h-[60vh]">
            <textarea
              value={exportContent}
              readOnly
              className="w-full h-full min-h-[300px] p-4 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono text-gray-800 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400"
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />
          </div>

          {/* 底部操作栏 */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <button
              onClick={() => setShowExportModal(false)}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              {t({ en: 'Close', zh: '关闭' })}
            </button>
            <button
              onClick={handleModalCopy}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                copySuccess === 'eft'
                  ? 'bg-green-600 text-white'
                  : 'bg-violet-600 hover:bg-violet-700 text-white'
              }`}
            >
              {copySuccess === 'eft' ? t({ en: 'Copied!', zh: '已复制!' }) : t({ en: 'Copy to Clipboard', zh: '复制到剪贴板' })}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* 截图弹窗 */}
    {showScreenshotModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-md"
          onClick={() => setShowScreenshotModal(false)}
        />
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* 头部 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {t({ en: 'Screenshot', zh: '截图' })}
            </h3>
            <button
              onClick={() => setShowScreenshotModal(false)}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* 内容区域 */}
          <div className="p-4 flex flex-col items-center relative overflow-hidden" style={{ height: 'calc(85vh - 140px)' }}>
            {/* 预览区域 - 用于截图 */}
            {isGenerating && (
              <div ref={screenshotRef} className="w-full max-w-sm">
                <ScreenshotPreview
                  shipName={shipName}
                  collectionName={collectionName}
                  seriesName={seriesName}
                  currentConfig={currentConfig}
                  currentBranch={currentBranch}
                  selectedFitIndex={selectedFitIndex}
                  alternativeSelections={alternativeSelections}
                  url={window.location.href}
                />
              </div>
            )}

            {/* 加载状态遮罩 */}
            {isGenerating && (
              <div className="absolute inset-0 bg-white/90 dark:bg-gray-800/90 flex items-center justify-center z-10">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 border-4 border-violet-200 dark:border-violet-700 border-t-violet-600 dark:border-t-violet-400 rounded-full animate-spin mb-4" />
                  <p className="text-gray-600 dark:text-gray-300">{t({ en: 'Generating screenshot...', zh: '正在生成截图...' })}</p>
                </div>
              </div>
            )}

            {/* 截图结果 */}
            {!isGenerating && screenshotImage && (
              <div className="w-full overflow-y-auto" style={{ height: '100%' }}>
                <img
                  src={screenshotImage}
                  alt={t({ en: 'Fit Screenshot', zh: '配置截图' })}
                  className="w-full rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
                />
              </div>
            )}
          </div>

          {/* 底部操作栏 */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <button
              onClick={() => setShowScreenshotModal(false)}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              {t({ en: 'Close', zh: '关闭' })}
            </button>
            {screenshotImage && (
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(screenshotImage);
                    const blob = await response.blob();
                    const item = new ClipboardItem({ 'image/png': blob });
                    await navigator.clipboard.write([item]);
                    setCopySuccess('screenshot');
                    setTimeout(() => setCopySuccess(null), 2000);
                  } catch (err) {
                    console.error('Failed to copy screenshot:', err);
                    const link = document.createElement('a');
                    link.href = screenshotImage;
                    link.download = `${shipName.replace(/[^a-zA-Z0-9]/g, '_')}_${t(currentConfig.name).replace(/[^a-zA-Z0-9]/g, '_')}.png`;
                    link.click();
                  }
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                  copySuccess === 'screenshot'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-violet-600 hover:bg-violet-700 text-white'
                }`}
              >
                <Copy className="w-4 h-4" />
                {copySuccess === 'screenshot' ? t({ en: 'Copied!', zh: '已复制!' }) : t({ en: 'Copy', zh: '复制' })}
              </button>
            )}
          </div>
        </div>
      </div>
    )}

    </>
  );
}
