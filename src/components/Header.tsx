import React from 'react';
import { Bell, LogOut, Menu } from 'lucide-react';
import { useAppContext } from '../hooks/useAppContext';
import { useAuth } from '../hooks/useAuth';
import { themeClasses } from '../utils/theme';
import ProfilePicture from './ProfilePicture';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, theme, invitations, setActiveTab } = useAppContext();
  const { logout, user: authUser } = useAuth();
  const currentTheme = themeClasses[theme];

  const handleLogout = () => {
    logout();
  };

  const handleNotificationClick = () => {
    setActiveTab('dashboard');
  };

  return (
    <div className={`${currentTheme.headerBg} border-b ${currentTheme.border} px-2 sm:px-4 py-3 sm:py-4`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className={`md:hidden p-2 rounded-lg ${currentTheme.hover} transition-colors`}
            aria-label="Toggle menu"
          >
            <Menu className={`h-5 w-5 ${currentTheme.text}`} />
          </button>

          <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <img src="/images/favicon/ms-icon-310x310.png" alt="Blue Moon Icon" className="w-full h-full object-cover rounded-full" />
          </div>
          <h1 className={`text-lg sm:text-xl font-bold ${currentTheme.text}`}>Blue Moon</h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Notifications */}
          <button
            onClick={handleNotificationClick}
            className={`relative p-1 sm:p-2 rounded-full ${currentTheme.hover} transition-colors`}
            title="View notifications"
          >
            <Bell className={`h-5 w-5 ${currentTheme.textSecondary}`} />
            {invitations.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {invitations.length}
              </span>
            )}
          </button>

          {/* User info - responsive */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <ProfilePicture
                name={authUser?.name || user.name}
                size="md"
                profileIcon={user.profileIcon}
              />
              <span className={`hidden sm:inline text-sm font-medium ${currentTheme.text}`}>
                {authUser?.name || user.name}
              </span>
            </div>

            {/* Logout button - icon only on mobile */}
            <button
              onClick={handleLogout}
              className={`flex items-center px-2 sm:px-3 py-1 rounded-md text-sm font-medium ${currentTheme.textSecondary} hover:${currentTheme.hover} transition-colors`}
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header; 