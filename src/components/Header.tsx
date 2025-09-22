import React from 'react';
import { Bell, User, LogOut } from 'lucide-react';
import { useAppContext } from '../hooks/useAppContext';
import { useAuth } from '../hooks/useAuth';
import { themeClasses } from '../utils/theme';
import ProfilePicture from './ProfilePicture';

const Header: React.FC = () => {
  const { user, theme } = useAppContext();
  const { logout, user: authUser } = useAuth();
  const currentTheme = themeClasses[theme];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className={`${currentTheme.headerBg} border-b ${currentTheme.border} px-4 py-4`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mr-3 flex items-center justify-center">
  <img src="/images/favicon/ms-icon-310x310.png" alt="Blue Moon Icon" className="w-full h-full object-cover rounded-full" />
</div>
          <h1 className={`text-xl font-bold ${currentTheme.text}`}>Blue Moon</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Bell className={`h-5 w-5 ${currentTheme.textSecondary}`} />
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <ProfilePicture 
                name={authUser?.name || user.name} 
                size="md" 
                className="mr-2" 
              />
              <span className={`text-sm font-medium ${currentTheme.text}`}>
                {authUser?.name || user.name}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className={`flex items-center px-3 py-1 rounded-md text-sm font-medium ${currentTheme.textSecondary} hover:${currentTheme.hover} transition-colors`}
              title="Logout"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header; 