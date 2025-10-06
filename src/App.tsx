import React, { useState } from 'react';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider } from './contexts/AuthContext';
import { useAppContext } from './hooks/useAppContext';
import { themeClasses } from './utils/theme';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Availability from './components/Availability';
import Groups from './components/Groups';
import Schedule from './components/Schedule';
import Settings from './components/Settings';
import ProtectedRoute from './components/ProtectedRoute';

const AppContent: React.FC = () => {
  const { activeTab, theme } = useAppContext();
  const currentTheme = themeClasses[theme];
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'availability':
        return <Availability />;
      case 'groups':
        return <Groups />;
      case 'schedule':
        return <Schedule />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className={`min-h-screen ${currentTheme.bg}`}>
      <Header onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6 h-full">
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 h-full min-h-[600px]">
          <Sidebar isMobileMenuOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
          <div className="flex-1 w-full">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <ProtectedRoute>
          <AppContent />
        </ProtectedRoute>
      </AppProvider>
    </AuthProvider>
  );
};

export default App;