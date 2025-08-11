import React from 'react';
import { Bell, User } from 'lucide-react';
import { useAppContext } from '../hooks/useAppContext';
import { themeClasses } from '../utils/theme';

const Header: React.FC = () => {
  const { user, theme } = useAppContext();
  const currentTheme = themeClasses[theme];

  return (
    <div className={`${currentTheme.headerBg} border-b ${currentTheme.border} px-4 py-4`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mr-3 flex items-center justify-center">
            <span className="text-white font-bold text-sm">🌙</span>
          </div>
          <h1 className={`text-xl font-bold ${currentTheme.text}`}>Blue Moon</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Bell className={`h-5 w-5 ${currentTheme.textSecondary}`} />
          <div className="flex items-center">
            <User className={`h-5 w-5 ${currentTheme.textSecondary} mr-2`} />
            <span className={`text-sm font-medium ${currentTheme.text}`}>{user.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header; 