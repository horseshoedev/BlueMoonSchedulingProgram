import React from 'react';
import { Calendar, Clock, Users, Settings } from 'lucide-react';
import { useAppContext } from '../hooks/useAppContext';
import { themeClasses } from '../utils/theme';
import { TabType } from '../types';

const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, theme } = useAppContext();
  const currentTheme = themeClasses[theme];

  const navItems: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <Calendar className="h-4 w-4 mr-3" /> },
    { key: 'availability', label: 'My Availability', icon: <Clock className="h-4 w-4 mr-3" /> },
    { key: 'groups', label: 'Groups', icon: <Users className="h-4 w-4 mr-3" /> },
    { key: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4 mr-3" /> }
  ];

  return (
    <div className={`w-full lg:w-64 space-y-2 ${currentTheme.sidebar} p-4 rounded-lg`}>
      {navItems.map(({ key, label, icon }) => (
        <button
          key={key}
          onClick={() => setActiveTab(key)}
          className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
            activeTab === key 
              ? 'bg-blue-100 text-blue-700 border border-blue-200' 
              : `${currentTheme.hover} ${currentTheme.text}`
          }`}
        >
          {icon}
          {label}
        </button>
      ))}
    </div>
  );
};

export default Sidebar; 