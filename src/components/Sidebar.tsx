import React from 'react';
import { Calendar, Clock, Users, Settings, CalendarDays, X } from 'lucide-react';
import { useAppContext } from '../hooks/useAppContext';
import { themeClasses } from '../utils/theme';
import { TabType } from '../types';

interface SidebarProps {
  isMobileMenuOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileMenuOpen, onClose }) => {
  const { activeTab, setActiveTab, theme } = useAppContext();
  const currentTheme = themeClasses[theme];

  const navItems: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <Calendar className="h-4 w-4 md:mr-3" /> },
    { key: 'availability', label: 'My Availability', icon: <Clock className="h-4 w-4 md:mr-3" /> },
    { key: 'groups', label: 'Groups', icon: <Users className="h-4 w-4 md:mr-3" /> },
    { key: 'schedule', label: 'Schedule', icon: <CalendarDays className="h-4 w-4 md:mr-3" /> },
    { key: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4 md:mr-3" /> }
  ];

  const handleNavClick = (key: TabType) => {
    setActiveTab(key);
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Desktop: static, Mobile: drawer */}
      <div className={`
        ${currentTheme.sidebar} p-4 rounded-lg space-y-2
        md:w-64 md:min-w-64 md:h-full md:static
        fixed top-0 left-0 h-full w-64 z-50 transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Mobile close button */}
        <div className="flex justify-between items-center mb-4 md:hidden">
          <h2 className={`text-lg font-semibold ${currentTheme.text}`}>Menu</h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${currentTheme.hover}`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {navItems.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => handleNavClick(key)}
            className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
              activeTab === key
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : `${currentTheme.hover} ${currentTheme.text}`
            }`}
          >
            {icon}
            <span className="md:inline">{label}</span>
          </button>
        ))}
      </div>
    </>
  );
};

export default Sidebar;