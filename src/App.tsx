import { HashRouter, Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { DarkModeProvider } from './context/DarkModeContext';
import { Header } from './components/Header';
import { CollectionList } from './components/CollectionList';
import { SeriesList } from './components/SeriesList';
import { FitDetail } from './components/FitDetail';
import FitGeneratorPage from './components/FitGeneratorPage';
import { parseFitsDirectory } from './utils/xmlParser';
import { loadSDEData, getItemByName } from './utils/sdeLoader';
import type { MainData, Collection, Series } from './types';
import { useState, useEffect, createContext, useContext } from 'react';

const AppContext = createContext<{
  data: MainData | null;
  selectedCollection: Collection | null;
  selectedSeries: Series | null;
  selectedConfigIndex: number;
  selectedBranchIndex: number;
  setSelectedCollection: (c: Collection | null) => void;
  setSelectedSeries: (s: Series | null) => void;
  setSelectedConfigIndex: (i: number) => void;
  setSelectedBranchIndex: (i: number) => void;
} | null>(null);

function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppContext.Provider');
  return context;
}

function HeaderWrapper() {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedCollection, selectedSeries, selectedConfigIndex, selectedBranchIndex } = useAppContext();

  const pathSegments: { label: string; active?: boolean }[] = [];

  const pathParts = location.pathname.split('/').filter(p => p);
  
  if (pathParts.length === 1) {
    if (selectedCollection) {
      pathSegments.push({ label: t(selectedCollection.name), active: true });
    }
  } else if (pathParts.length >= 2) {
    if (selectedCollection) {
      pathSegments.push({ label: t(selectedCollection.name) });
    }
    if (selectedSeries) {
      pathSegments.push({ label: t(selectedSeries.name) });

      const config = selectedSeries.configs[selectedConfigIndex];
      if (config) {
        pathSegments.push({ label: t(config.name), active: true });

        const branch = config.branches[selectedBranchIndex];
        const fit = branch?.fits[0];
        if (fit) {
          const sdeItem = getItemByName(fit.shipName);
          pathSegments.push({ 
            label: sdeItem ? t({ en: sdeItem.name.en, zh: sdeItem.name.zh || sdeItem.name.en }) : fit.shipName 
          });
          pathSegments.push({ label: t(branch.name) });
        }
      }
    }
  }

  return (
    <Header
      path={pathSegments.length > 0 ? pathSegments : undefined}
      onHome={() => navigate('/')}
    />
  );
}

import { Footer } from './components/Footer';

function HomePage() {
  const { data } = useAppContext();
  const navigate = useNavigate();

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  return <CollectionList collections={data.collections} onSelect={(c) => navigate(`/${c.url}`)} />;
}

function SeriesPageRoute() {
  const params = useParams();
  const navigate = useNavigate();
  const { data, setSelectedCollection } = useAppContext();

  const collectionUrl = params.collectionUrl || '';
  const collection = data?.collections.find(c => c.url === collectionUrl);

  useEffect(() => {
    if (collection) {
      setSelectedCollection(collection);
    }
  }, [collection, setSelectedCollection]);

  if (!collection) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Collection not found</p>
      </div>
    );
  }

  return (
    <SeriesList
      collection={collection}
      onSelect={(s) => {
        const firstConfig = s.configs[0];
        if (firstConfig && firstConfig.url) {
          navigate(`/${collectionUrl}/${s.url}/${firstConfig.url}`);
        } else {
          navigate(`/${collectionUrl}/${s.url}`);
        }
      }}
      onBack={() => navigate('/')}
    />
  );
}

function FitPageRoute() {
  const params = useParams();
  const navigate = useNavigate();
  const { data, setSelectedSeries } = useAppContext();

  const collectionUrl = params.collectionUrl || '';
  const seriesUrl = params.seriesUrl || '';
  const configUrl = params.configUrl || '';

  const collection = data?.collections.find(c => c.url === collectionUrl);
  const series = collection?.series.find(s => s.url === seriesUrl);

  useEffect(() => {
    if (series) {
      setSelectedSeries(series);
    }
  }, [series, setSelectedSeries]);

  if (!collection || !series) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Series not found</p>
      </div>
    );
  }

  const initialConfigIndex = configUrl 
    ? series.configs.findIndex(c => c.url === configUrl)
    : 0;

  const [localConfigIndex, setLocalConfigIndex] = useState(initialConfigIndex >= 0 ? initialConfigIndex : 0);
  const [localBranchIndex, setLocalBranchIndex] = useState(0);

  const handleConfigIndexChange = (index: number) => {
    setLocalConfigIndex(index);
    const config = series.configs[index];
    if (config && config.url) {
      navigate(`/${collectionUrl}/${seriesUrl}/${config.url}`);
    }
  };

  const handleSeriesChange = (newSeries: Series) => {
    const firstConfig = newSeries.configs[0];
    if (firstConfig && firstConfig.url) {
      navigate(`/${collectionUrl}/${newSeries.url}/${firstConfig.url}`);
    } else {
      navigate(`/${collectionUrl}/${newSeries.url}`);
    }
  };

  return (
    <FitDetail
      series={series}
      collectionName={collection.name}
      allSeries={collection.series}
      selectedConfigIndex={localConfigIndex}
      setSelectedConfigIndex={handleConfigIndexChange}
      selectedBranchIndex={localBranchIndex}
      setSelectedBranchIndex={setLocalBranchIndex}
      onBack={() => navigate(`/${collectionUrl}`)}
      onSelectSeries={handleSeriesChange}
    />
  );
}

function AppContent() {
  const { t } = useLanguage();
  const location = useLocation();
  const [data, setData] = useState<MainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);

  const showFooter = () => {
    const pathParts = location.pathname.split('/').filter(p => p);
    return pathParts.length <= 1;
  };
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [selectedConfigIndex, setSelectedConfigIndex] = useState(0);
  const [selectedBranchIndex, setSelectedBranchIndex] = useState(0);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await loadSDEData();
        const fitsData = await parseFitsDirectory();
        setData(fitsData);
      } catch (e) {
        console.error('Failed to initialize:', e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (data) {
      document.title = t(data.name);
    }
  }, [data, t]);

  if (loading) {
    return (
      <AppContext.Provider value={{
        data: null,
        selectedCollection: null,
        selectedSeries: null,
        selectedConfigIndex: 0,
        selectedBranchIndex: 0,
        setSelectedCollection: () => {},
        setSelectedSeries: () => {},
        setSelectedConfigIndex: () => {},
        setSelectedBranchIndex: () => {},
      }}>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
          <HeaderWrapper />
          <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">{t({ en: 'Loading...', zh: '加载中...' })}</p>
            </div>
          </div>
        </div>
      </AppContext.Provider>
    );
  }

  return (
    <AppContext.Provider value={{
      data,
      selectedCollection,
      selectedSeries,
      selectedConfigIndex,
      selectedBranchIndex,
      setSelectedCollection,
      setSelectedSeries,
      setSelectedConfigIndex,
      setSelectedBranchIndex,
    }}>
      <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900 overflow-hidden">
        <HeaderWrapper />
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/generator" element={<FitGeneratorPage />} />
            <Route path="/:collectionUrl" element={<SeriesPageRoute />} />
            <Route path="/:collectionUrl/:seriesUrl" element={<FitPageRoute />} />
            <Route path="/:collectionUrl/:seriesUrl/:configUrl" element={<FitPageRoute />} />
          </Routes>
        </div>
        {data && showFooter() && <Footer footer={data.footer} />}
      </div>
    </AppContext.Provider>
  );
}

function App() {
  return (
    <HashRouter>
      <LanguageProvider>
        <DarkModeProvider>
          <AppContent />
        </DarkModeProvider>
      </LanguageProvider>
    </HashRouter>
  );
}

export default App;