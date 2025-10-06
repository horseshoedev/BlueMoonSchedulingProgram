import React, { useState } from 'react';
import { X, Calendar, Lock, User, Server } from 'lucide-react';
import { themeClasses } from '../utils/theme';
import { iCalConfig } from '../types';

interface CalendarSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (config: iCalConfig) => Promise<void>;
  theme: 'light' | 'dark';
}

const CalendarSyncModal: React.FC<CalendarSyncModalProps> = ({
  isOpen,
  onClose,
  onConnect,
  theme
}) => {
  const currentTheme = themeClasses[theme];
  const [formData, setFormData] = useState<iCalConfig>({
    serverUrl: '',
    username: '',
    password: '',
    calendarName: ''
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsConnecting(true);

    try {
      await onConnect(formData);
      setFormData({ serverUrl: '', username: '', password: '', calendarName: '' });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to calendar');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleChange = (field: keyof iCalConfig, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${currentTheme.cardBg} border ${currentTheme.border} rounded-lg max-w-md w-full`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 sm:p-6 border-b ${currentTheme.border}`}>
          <div className="flex items-center gap-2">
            <Calendar className={`h-5 w-5 ${currentTheme.text}`} />
            <h3 className={`text-lg font-semibold ${currentTheme.text}`}>Connect iCal/CalDAV</h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-full ${currentTheme.hover} transition-colors`}
          >
            <X className={`h-5 w-5 ${currentTheme.textSecondary}`} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {/* Server URL */}
          <div>
            <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
              CalDAV Server URL *
            </label>
            <div className="relative">
              <Server className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${currentTheme.textSecondary}`} />
              <input
                type="url"
                value={formData.serverUrl}
                onChange={(e) => handleChange('serverUrl', e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded ${currentTheme.input}`}
                placeholder="https://caldav.example.com/calendars/user"
                required
              />
            </div>
            <p className={`text-xs ${currentTheme.textMuted} mt-1`}>
              Your CalDAV server address (e.g., Google, iCloud, Nextcloud)
            </p>
          </div>

          {/* Username */}
          <div>
            <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
              Username *
            </label>
            <div className="relative">
              <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${currentTheme.textSecondary}`} />
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded ${currentTheme.input}`}
                placeholder="your.email@example.com"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
              Password/App Password *
            </label>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${currentTheme.textSecondary}`} />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded ${currentTheme.input}`}
                placeholder="••••••••"
                required
              />
            </div>
            <p className={`text-xs ${currentTheme.textMuted} mt-1`}>
              Use an app-specific password if available
            </p>
          </div>

          {/* Calendar Name */}
          <div>
            <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
              Calendar Name (optional)
            </label>
            <input
              type="text"
              value={formData.calendarName}
              onChange={(e) => handleChange('calendarName', e.target.value)}
              className={`w-full px-3 py-2 border rounded ${currentTheme.input}`}
              placeholder="My iCal Calendar"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          {/* Info Box */}
          <div className={`p-3 ${theme === 'light' ? 'bg-blue-50 border-blue-200' : 'bg-blue-900 border-blue-700'} border rounded text-sm`}>
            <p className={`font-medium ${theme === 'light' ? 'text-blue-800' : 'text-blue-300'} mb-1`}>
              Supported Services:
            </p>
            <ul className={`text-xs ${theme === 'light' ? 'text-blue-700' : 'text-blue-400'} space-y-1 list-disc list-inside`}>
              <li>Google Calendar (via CalDAV)</li>
              <li>Apple iCloud Calendar</li>
              <li>Nextcloud/ownCloud</li>
              <li>Any CalDAV-compatible service</li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2 border ${currentTheme.border} rounded ${currentTheme.hover} ${currentTheme.text} transition-colors`}
              disabled={isConnecting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isConnecting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isConnecting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Connecting...
                </span>
              ) : (
                'Connect Calendar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CalendarSyncModal;
