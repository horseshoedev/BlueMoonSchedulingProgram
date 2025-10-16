import React, { useState, lazy, Suspense } from 'react';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider } from './contexts/AuthContext';
import { useAppContext } from './hooks/useAppContext';
import { themeClasses } from './utils/theme';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load route components for code splitting
const Dashboard = lazy(() => import('./components/Dashboard'));
const Availability = lazy(() => import('./components/Availability'));
const Groups = lazy(() => import('./components/Groups'));
const Schedule = lazy(() => import('./components/Schedule'));
const Settings = lazy(() => import('./components/Settings'));

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
            <Suspense fallback={
              <div className="flex items-center justify-center h-full">
                <div className={`text-lg ${currentTheme.text}`}>Loading...</div>
              </div>
            }>
              {renderContent()}
            </Suspense>
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