import React from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { themeClasses } from '../utils/theme';
import { formatTime } from '../utils/time';

const Settings: React.FC = () => {
  const { user, setUser, theme, setTheme } = useAppContext();
  const currentTheme = themeClasses[theme];

  const handleTimeFormatChange = (timeFormat: '12' | '24') => {
    setUser({
      ...user,
      preferences: { ...user.preferences, timeFormat }
    });
  };

  const handleWorkingHoursChange = (field: 'start' | 'end', value: string) => {
    setUser({
      ...user,
      preferences: {
        ...user.preferences,
        workingHours: {
          ...user.preferences.workingHours,
          [field]: value
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <h2 className={`text-xl font-bold ${currentTheme.text}`}>Settings</h2>
      
      <div className={`${currentTheme.cardBg} border ${currentTheme.border} rounded-lg p-6 space-y-6`}>
        <div>
          <h3 className={`font-semibold mb-3 ${currentTheme.text}`}>Appearance</h3>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>Theme</label>
              <select 
                value={theme}
                onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
                className={`w-full px-3 py-2 border rounded ${currentTheme.input}`}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>Time Format</label>
              <select 
                value={user.preferences.timeFormat}
                onChange={(e) => handleTimeFormatChange(e.target.value as '12' | '24')}
                className={`w-full px-3 py-2 border rounded ${currentTheme.input}`}
              >
                <option value="12">12-hour (12:00 PM)</option>
                <option value="24">24-hour (12:00)</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <h3 className={`font-semibold mb-3 ${currentTheme.text}`}>Working Hours</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${currentTheme.text} mb-1`}>Start Time</label>
              <input 
                type="time" 
                value={user.preferences.workingHours.start}
                onChange={(e) => handleWorkingHoursChange('start', e.target.value)}
                className={`w-full px-3 py-2 border rounded ${currentTheme.input}`}
              />
              <p className={`text-xs ${currentTheme.textMuted} mt-1`}>
                {formatTime(user.preferences.workingHours.start, user.preferences.timeFormat)}
              </p>
            </div>
            <div>
              <label className={`block text-sm font-medium ${currentTheme.text} mb-1`}>End Time</label>
              <input 
                type="time" 
                value={user.preferences.workingHours.end}
                onChange={(e) => handleWorkingHoursChange('end', e.target.value)}
                className={`w-full px-3 py-2 border rounded ${currentTheme.input}`}
              />
              <p className={`text-xs ${currentTheme.textMuted} mt-1`}>
                {formatTime(user.preferences.workingHours.end, user.preferences.timeFormat)}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h3 className={`font-semibold mb-3 ${currentTheme.text}`}>Preferred Meeting Times</h3>
          <div className="space-y-2">
            {['Morning (9-12)', 'Afternoon (12-17)', 'Evening (17-20)'].map(time => (
              <label key={time} className="flex items-center">
                <input type="checkbox" className="mr-2" defaultChecked />
                <span className={`text-sm ${currentTheme.text}`}>{time}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className={`font-semibold mb-3 ${currentTheme.text}`}>Calendar Integration</h3>
          <div className="space-y-3">
            <div className={`flex items-center justify-between p-3 ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-700'} rounded`}>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded mr-3"></div>
                <div>
                  <p className={`font-medium ${currentTheme.text}`}>Google Calendar</p>
                  <p className={`text-sm ${currentTheme.textSecondary}`}>Connected</p>
                </div>
              </div>
              <button className="px-3 py-1 bg-red-100 text-red-600 text-sm rounded">
                Disconnect
              </button>
            </div>
            <button className={`w-full px-4 py-2 border ${currentTheme.border} rounded ${currentTheme.hover} ${currentTheme.text}`}>
              + Add Calendar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 