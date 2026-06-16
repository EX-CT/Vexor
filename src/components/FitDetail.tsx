import { useState, useEffect, useCallback } from 'react';
import { Menu, Info } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Sidebar } from './Sidebar';
import { RightPanel } from './RightPanel';
import { EquipmentColumn } from './EquipmentColumn';
import type { Series, FitConfig, FitEquipment } from '../types';

interface FitDetailProps {
  series: Series;
  collectionName?: { en: string; zh: string };
  initialConfig?: FitConfig;
  onBack: () => void;
  onSelectSeries: (series: Series) => void;
  allSeries: Series[];
  selectedConfigIndex: number;
  setSelectedConfigIndex: (index: number) => void;
  selectedBranchIndex: number;
  setSelectedBranchIndex: (index: number) => void;
}

export function FitDetail({ 
  series, 
  collectionName,
  initialConfig, 
  onBack, 
  onSelectSeries, 
  allSeries,
  selectedConfigIndex: externalConfigIndex,
  setSelectedConfigIndex: setExternalConfigIndex,
  selectedBranchIndex: externalBranchIndex,
  setSelectedBranchIndex: setExternalBranchIndex
}: FitDetailProps) {
  const { t, lang } = useLanguage();
  const [selectedConfigIndex, setSelectedConfigIndex] = useState(externalConfigIndex);
  const [selectedBranchIndex, setSelectedBranchIndex] = useState(externalBranchIndex);
  const [selectedFitIndex, setSelectedFitIndex] = useState(0);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    low: true,
    med: true,
    high: true,
    rig: true,
    drone: true,
    cargo: true,
    sub: true,
  });
  const [alternativeSelections, setAlternativeSelections] = useState<Record<string, number>>({});
  
  const handleAlternativeChange = useCallback((key: string, value: number) => {
    setAlternativeSelections(prev => ({ ...prev, [key]: value }));
  }, []);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileRightPanelOpen, setMobileRightPanelOpen] = useState(false);

  // 初始化和监听窗口大小变化
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // 移动端左边栏默认收进，右边栏默认展开
      if (mobile) {
        setSidebarCollapsed(true);
        setRightPanelCollapsed(false);
      } else {
        setSidebarCollapsed(false);
        setRightPanelCollapsed(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 同步外部状态
  useEffect(() => {
    setSelectedConfigIndex(externalConfigIndex);
    setSelectedBranchIndex(externalBranchIndex);
  }, [externalConfigIndex, externalBranchIndex]);

  // 切换配置
  const handleConfigChange = (index: number) => {
    setSelectedConfigIndex(index);
    setExternalConfigIndex(index);
    setSelectedBranchIndex(0);
    setExternalBranchIndex(0);
    const fitsLength = series.configs[index]?.branches[0]?.fits?.length || 1;
    setSelectedFitIndex(fitsLength - 1);
  };

  // 切换 branch
  const handleBranchChange = (index: number) => {
    setSelectedBranchIndex(index);
    setExternalBranchIndex(index);
    const fitsLength = series.configs[selectedConfigIndex]?.branches[index]?.fits?.length || 1;
    setSelectedFitIndex(fitsLength - 1);
  };

  // 初始化
  useEffect(() => {
    if (initialConfig) {
      const configIndex = series.configs.indexOf(initialConfig);
      setSelectedConfigIndex(configIndex >= 0 ? configIndex : 0);
    } else {
      // 保持外部传入的索引，不从 0 开始
      setSelectedConfigIndex(externalConfigIndex >= 0 ? externalConfigIndex : 0);
    }
    setSelectedBranchIndex(0);
    setAlternativeSelections({});
    
    const currentConfig = series.configs[initialConfig ? series.configs.indexOf(initialConfig) : (externalConfigIndex >= 0 ? externalConfigIndex : 0)];
    const currentBranch = currentConfig?.branches[0];
    const fitsLength = currentBranch?.fits?.length || 1;
    setSelectedFitIndex(fitsLength - 1);
  }, [series, initialConfig]);

  // 边界检查
  useEffect(() => {
    const currentConfig = series.configs[selectedConfigIndex];
    if (!currentConfig) {
      setSelectedConfigIndex(0);
      return;
    }
    if (selectedBranchIndex >= currentConfig.branches.length) {
      setSelectedBranchIndex(0);
    }
    const currentBranchFits = currentConfig.branches[selectedBranchIndex]?.fits;
    if (currentBranchFits && selectedFitIndex >= currentBranchFits.length) {
      setSelectedFitIndex(currentBranchFits.length - 1);
    }
  }, [selectedConfigIndex, selectedBranchIndex, selectedFitIndex, series.configs]);

  const currentConfig = series.configs[selectedConfigIndex];
  const currentBranch = currentConfig?.branches[selectedBranchIndex];
  const currentFit = currentBranch?.fits[selectedFitIndex] || currentBranch?.fits[0];

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSeriesChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newSeries = allSeries.find(s => t(s.name) === event.target.value);
    if (newSeries) {
      onSelectSeries(newSeries);
      setSelectedConfigIndex(0);
      setSelectedBranchIndex(0);
    }
  };

  if (!currentConfig || !currentBranch || !currentFit) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar
          series={series}
          collectionName={collectionName}
          selectedConfigIndex={0}
          onConfigChange={() => {}}
          onSeriesChange={() => {}}
          allSeries={allSeries}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onBack={onBack}
        />
        <main className="flex-1 p-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300 mb-6 transition-colors"
          >
            <span>{t({ en: 'Back to Collection', zh: '返回合集' })}</span>
          </button>
          <p className="text-center text-gray-500 dark:text-gray-400">
            {t({ en: 'No fit data available', zh: '没有可用的配置数据' })}
          </p>
        </main>
      </div>
    );
  }

  const sectionLabels: Record<string, { en: string; zh: string }> = {
    sub: { en: 'Subsystems', zh: '子系统' },
    high: { en: 'High Slots', zh: '高槽' },
    med: { en: 'Mid Slots', zh: '中槽' },
    low: { en: 'Low Slots', zh: '低槽' },
    rig: { en: 'Rigs', zh: '改装件' },
    drone: { en: 'Drones', zh: '无人机' },
    cargo: { en: 'Cargo', zh: '货舱' },
  };

  const staticLeftSections = [
    { key: 'sub' as keyof FitEquipment, label: sectionLabels['sub'] },
    { key: 'high' as keyof FitEquipment, label: sectionLabels['high'] },
    { key: 'med' as keyof FitEquipment, label: sectionLabels['med'] },
    { key: 'drone' as keyof FitEquipment, label: sectionLabels['drone'] },
  ];
  
  const staticRightSections = [
    { key: 'low' as keyof FitEquipment, label: sectionLabels['low'] },
    { key: 'rig' as keyof FitEquipment, label: sectionLabels['rig'] },
  ];

  // 计算每列的行数（考虑合并显示）
  const getMergedRowCount = (items: typeof currentFit.equipment[keyof typeof currentFit.equipment], sectionKey: string) => {
    if (!items || items.length === 0) return 0;
    
    const shouldMerge = ['high', 'med', 'low', 'rig'].includes(sectionKey);
    
    if (shouldMerge) {
      // 按名称+弹药去重
      const uniqueMap = new Map<string, boolean>();
      items.forEach(item => {
        const key = `${item.name}|${item.ammo || ''}`;
        uniqueMap.set(key, true);
      });
      return uniqueMap.size;
    } else {
      // drone, cargo, sub 等不合并
      return items.length;
    }
  };
  
  const leftRowCount = staticLeftSections.reduce((sum, s) => {
    return sum + getMergedRowCount(currentFit.equipment[s.key], s.key);
  }, 0);
  
  const rightRowCount = staticRightSections.reduce((sum, s) => {
    return sum + getMergedRowCount(currentFit.equipment[s.key], s.key);
  }, 0);

  const cargoSection = { key: 'cargo' as keyof FitEquipment, label: sectionLabels['cargo'] };
  const leftSections = leftRowCount <= rightRowCount 
    ? [...staticLeftSections, cargoSection] 
    : staticLeftSections;
  const rightSections = leftRowCount > rightRowCount 
    ? [...staticRightSections, cargoSection] 
    : staticRightSections;

  return (
    <div className="min-h-full bg-gray-100 dark:bg-gray-900">
      <div className="flex min-h-full">
        {/* 桌面端: 左侧边栏 (inline) */}
        {!isMobile && (
          <Sidebar
            series={series}
            collectionName={collectionName}
            selectedConfigIndex={selectedConfigIndex}
            onConfigChange={handleConfigChange}
            onSeriesChange={handleSeriesChange}
            allSeries={allSeries}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            onBack={onBack}
          />
        )}

        {/* 主内容区 */}
        <main className="flex-1 flex relative min-w-0">
          {/* 中间装备区域 - 两列 */}
          <div className="flex-1 p-4 bg-gray-100 dark:bg-gray-900 min-w-0">
            {/* 移动端: 浮动按钮 */}
            {isMobile && (
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => setMobileSidebarOpen(true)}
                  className="p-2 bg-violet-100 dark:bg-violet-900/50 hover:bg-violet-200 dark:hover:bg-violet-900/70 rounded-lg transition-colors"
                >
                  <Menu className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                </button>
                <button
                  onClick={() => setMobileRightPanelOpen(true)}
                  className="p-2 bg-violet-100 dark:bg-violet-900/50 hover:bg-violet-200 dark:hover:bg-violet-900/70 rounded-lg transition-colors"
                >
                  <Info className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                </button>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                  {t(collectionName || { en: '', zh: '' })} / {t(series.name)}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 左列 */}
              <EquipmentColumn
                sections={leftSections}
                equipment={currentFit.equipment}
                expandedSections={expandedSections}
                onToggleSection={toggleSection}
                alternativeSelections={alternativeSelections}
                onAlternativeChange={handleAlternativeChange}
              />
              {/* 右列 */}
              <EquipmentColumn
                sections={rightSections}
                equipment={currentFit.equipment}
                expandedSections={expandedSections}
                onToggleSection={toggleSection}
                alternativeSelections={alternativeSelections}
                onAlternativeChange={handleAlternativeChange}
              />
            </div>
          </div>

          {/* 桌面端: 右侧信息栏 (inline) */}
          {!isMobile && (
            <RightPanel
              shipName={currentFit.shipName}
              lang={lang}
              collectionName={t(collectionName || { en: '', zh: '' })}
              seriesName={t(series.name)}
              currentConfig={currentConfig}
              currentBranch={currentBranch}
              selectedBranchIndex={selectedBranchIndex}
              selectedFitIndex={selectedFitIndex}
              onBranchChange={handleBranchChange}
              onFitIndexChange={setSelectedFitIndex}
              collapsed={rightPanelCollapsed}
              onToggleCollapse={() => setRightPanelCollapsed(!rightPanelCollapsed)}
              alternativeSelections={alternativeSelections}
              onAlternativeChange={handleAlternativeChange}
            />
          )}
        </main>
      </div>

      {/* 移动端: 侧边栏浮动覆盖 */}
      {isMobile && mobileSidebarOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 bg-gray-50 dark:bg-gray-800 shadow-xl overflow-hidden">
            <Sidebar
              series={series}
              collectionName={collectionName}
              selectedConfigIndex={selectedConfigIndex}
              onConfigChange={(i) => { handleConfigChange(i); setMobileSidebarOpen(false); }}
              onSeriesChange={(e) => { handleSeriesChange(e); }}
              allSeries={allSeries}
              collapsed={false}
              onToggleCollapse={() => setMobileSidebarOpen(false)}
              onBack={() => { setMobileSidebarOpen(false); onBack(); }}
            />
          </div>
        </div>
      )}

      {/* 移动端: 右侧面板浮动覆盖 */}
      {isMobile && mobileRightPanelOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileRightPanelOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white dark:bg-gray-800 shadow-xl overflow-y-auto">
            <RightPanel
              shipName={currentFit.shipName}
              lang={lang}
              collectionName={t(collectionName || { en: '', zh: '' })}
              seriesName={t(series.name)}
              currentConfig={currentConfig}
              currentBranch={currentBranch}
              selectedBranchIndex={selectedBranchIndex}
              selectedFitIndex={selectedFitIndex}
              onBranchChange={handleBranchChange}
              onFitIndexChange={setSelectedFitIndex}
              collapsed={false}
              onToggleCollapse={() => setMobileRightPanelOpen(false)}
              alternativeSelections={alternativeSelections}
              onAlternativeChange={handleAlternativeChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}
