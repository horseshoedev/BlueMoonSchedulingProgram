import React from 'react';
import { AppProvider } from './contexts/AppContext';
import { useAppContext } from './hooks/useAppContext';
import { themeClasses } from './utils/theme';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Availability from './components/Availability';
import Groups from './components/Groups';
import Settings from './components/Settings';

const AppContent: React.FC = () => {
  const { activeTab, theme } = useAppContext();
  const currentTheme = themeClasses[theme];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'availability':
        return <Availability />;
      case 'groups':
        return <Groups />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className={`min-h-screen ${currentTheme.bg}`}>
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-6 h-full">
        <div className="flex flex-row gap-6 h-full min-h-[600px]">
          <Sidebar />
          <div className="flex-1">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;