import React, { useState, useEffect, lazy, Suspense, useMemo, useCallback } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { useAuth } from '../hooks/useAuth';
import { themeClasses } from '../utils/theme';
import { formatTime } from '../utils/time';
import { User, Mail, Lock, Camera, Save, Eye, EyeOff, X, RefreshCw } from 'lucide-react';
import ProfilePicture from './ProfilePicture';
import { googleCalendarService, iCalService, getAllIntegrations } from '../services/calendar';
import { CalendarIntegration, iCalConfig } from '../types';

// Lazy load calendar modal
const CalendarSyncModal = lazy(() => import('./CalendarSyncModal'));

const Settings: React.FC = () => {
  const { user, setUser, theme, setTheme } = useAppContext();
  const { user: authUser } = useAuth();
  const currentTheme = themeClasses[theme];
  
  // Available user icons
  const userIcons = useMemo(() => [
    { name: 'Sol', path: '/images/userIcons/solUserIcon.png' },
    { name: 'Mercury', path: '/images/userIcons/mercuryUserIcon.png' },
    { name: 'Mars', path: '/images/userIcons/marsUserIcon.png' },
    { name: 'Jupiter', path: '/images/userIcons/jupiterUserIcon.png' },
    { name: 'Saturn', path: '/images/userIcons/saturnUserIcon.png' }
  ], []);

  // Profile state
  const [profileData, setProfileData] = useState({
    name: authUser?.name || user.name,
    email: authUser?.email || user.email,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);

  // Calendar integration state
  const [calendarIntegrations, setCalendarIntegrations] = useState<CalendarIntegration[]>([]);
  const [showICalModal, setShowICalModal] = useState(false);
  const [isLoadingCalendars, setIsLoadingCalendars] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);

  const handleProfileChange = useCallback((field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handlePasswordToggle = useCallback((field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  }, []);

  const handleIconSelect = useCallback((iconPath: string) => {
    setUser({
      ...user,
      profileIcon: iconPath
    });
    setShowIconPicker(false);
  }, [user, setUser]);

  const handleOpenIconPicker = useCallback(() => {
    setShowIconPicker(true);
  }, []);

  const handleProfileUpdate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage(null);

    try {
      // Validate passwords if changing
      if (profileData.newPassword) {
        if (profileData.newPassword !== profileData.confirmPassword) {
          throw new Error('New passwords do not match');
        }
        if (profileData.newPassword.length < 6) {
          throw new Error('New password must be at least 6 characters');
        }
      }

      // Here you would typically make API calls to update the profile
      // For now, we'll just update the local state
      setUser({
        ...user,
        name: profileData.name,
        email: profileData.email
      });

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      
      // Reset password fields
      setProfileData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to update profile' 
      });
    } finally {
      setIsUpdating(false);
    }
  }, [profileData, user, setUser]);

  const handleTimeFormatChange = useCallback((timeFormat: '12' | '24') => {
    setUser({
      ...user,
      preferences: { ...user.preferences, timeFormat }
    });
  }, [user, setUser]);

  const handleWorkingHoursChange = useCallback((field: 'start' | 'end', value: string) => {
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
  }, [user, setUser]);

  const handlePreferredTimeChange = useCallback((timeSlot: string, checked: boolean) => {
    const currentTimes = user.preferences.preferredTimes;
    let newTimes;

    if (checked) {
      newTimes = [...currentTimes, timeSlot];
    } else {
      newTimes = currentTimes.filter(time => time !== timeSlot);
    }

    setUser({
      ...user,
      preferences: {
        ...user.preferences,
        preferredTimes: newTimes
      }
    });
  }, [user, setUser]);

  const loadCalendarIntegrations = useCallback(async () => {
    setIsLoadingCalendars(true);
    setCalendarError(null);

    try {
      const integrations = await getAllIntegrations();
      setCalendarIntegrations(integrations);
    } catch (error) {
      console.error('Failed to load calendar integrations:', error);
      setCalendarError('Failed to load calendar integrations');
    } finally {
      setIsLoadingCalendars(false);
    }
  }, []);

  // Load calendar integrations on mount
  useEffect(() => {
    loadCalendarIntegrations();
  }, [loadCalendarIntegrations]);

  // Listen for OAuth popup messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'google-oauth-success') {
        loadCalendarIntegrations();
        setMessage({ type: 'success', text: 'Google Calendar connected successfully!' });
      } else if (event.data.type === 'google-oauth-error') {
        setCalendarError(event.data.error || 'Failed to connect Google Calendar');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [loadCalendarIntegrations]);

  const handleConnectGoogle = useCallback(async () => {
    try {
      setCalendarError(null);
      const authUrl = await googleCalendarService.getAuthUrl();

      // Open OAuth flow in popup
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      window.open(
        authUrl,
        'Google Calendar Authorization',
        `width=${width},height=${height},left=${left},top=${top}`
      );
    } catch (error) {
      setCalendarError(error instanceof Error ? error.message : 'Failed to initiate Google OAuth');
    }
  }, []);

  const handleDisconnectGoogle = useCallback(async () => {
    try {
      setCalendarError(null);
      await googleCalendarService.disconnect();
      await loadCalendarIntegrations();
      setMessage({ type: 'success', text: 'Google Calendar disconnected successfully!' });
    } catch (error) {
      setCalendarError(error instanceof Error ? error.message : 'Failed to disconnect Google Calendar');
    }
  }, [loadCalendarIntegrations]);

  const handleConnectICal = useCallback(async (config: iCalConfig) => {
    setCalendarError(null);
    await iCalService.connect(config);
    await loadCalendarIntegrations();
    setMessage({ type: 'success', text: 'iCal calendar connected successfully!' });
  }, [loadCalendarIntegrations]);

  const handleDisconnectICal = useCallback(async () => {
    try {
      setCalendarError(null);
      await iCalService.disconnect();
      await loadCalendarIntegrations();
      setMessage({ type: 'success', text: 'iCal calendar disconnected successfully!' });
    } catch (error) {
      setCalendarError(error instanceof Error ? error.message : 'Failed to disconnect iCal calendar');
    }
  }, [loadCalendarIntegrations]);

  const googleIntegration = useMemo(() => calendarIntegrations.find(ci => ci.provider === 'google'), [calendarIntegrations]);
  const iCalIntegration = useMemo(() => calendarIntegrations.find(ci => ci.provider === 'ical'), [calendarIntegrations]);

  return (
    <div className="space-y-6">
      <h2 className={`text-xl font-bold ${currentTheme.text}`}>Settings</h2>
      
      {/* Profile Section */}
      <div className={`${currentTheme.cardBg} border ${currentTheme.border} rounded-lg p-6 space-y-6`}>
        <div className="flex items-center space-x-3 mb-6">
          <User className={`h-6 w-6 ${currentTheme.text}`} />
          <h3 className={`text-lg font-semibold ${currentTheme.text}`}>Profile</h3>
        </div>

        <form onSubmit={handleProfileUpdate} className="space-y-6">
          {/* Profile Picture */}
          <div>
            <label className={`block text-sm font-medium ${currentTheme.text} mb-3`}>Profile Picture</label>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <ProfilePicture
                  name={profileData.name}
                  size="lg"
                  profileIcon={user.profileIcon}
                />
                <button
                  type="button"
                  onClick={handleOpenIconPicker}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors"
                  aria-label="Change profile picture"
                >
                  <Camera className="h-4 w-4 text-white" />
                </button>
              </div>
              <div>
                <p className={`text-sm ${currentTheme.textSecondary}`}>
                  Click the camera icon to choose a profile icon
                </p>
                {user.profileIcon && (
                  <p className={`text-xs ${currentTheme.textMuted}`}>
                    Current: {userIcons.find(icon => icon.path === user.profileIcon)?.name || 'Custom'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>Full Name</label>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => handleProfileChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded ${currentTheme.input}`}
              placeholder="Enter your full name"
            />
          </div>

          {/* Email */}
          <div>
            <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>Email Address</label>
            <div className="relative">
              <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${currentTheme.textSecondary}`} />
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => handleProfileChange('email', e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded ${currentTheme.input}`}
                placeholder="Enter your email address"
              />
            </div>
          </div>

          {/* Password Section */}
          <div className="border-t pt-6">
            <h4 className={`font-medium ${currentTheme.text} mb-4`}>Change Password</h4>
            
            {/* Current Password */}
            <div className="mb-4">
              <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>Current Password</label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${currentTheme.textSecondary}`} />
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={profileData.currentPassword}
                  onChange={(e) => handleProfileChange('currentPassword', e.target.value)}
                  className={`w-full pl-10 pr-10 py-2 border rounded ${currentTheme.input}`}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => handlePasswordToggle('current')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
                  aria-label={showPasswords.current ? "Hide current password" : "Show current password"}
                >
                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="mb-4">
              <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>New Password</label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${currentTheme.textSecondary}`} />
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={profileData.newPassword}
                  onChange={(e) => handleProfileChange('newPassword', e.target.value)}
                  className={`w-full pl-10 pr-10 py-2 border rounded ${currentTheme.input}`}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => handlePasswordToggle('new')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
                  aria-label={showPasswords.new ? "Hide new password" : "Show new password"}
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="mb-4">
              <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>Confirm New Password</label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${currentTheme.textSecondary}`} />
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={profileData.confirmPassword}
                  onChange={(e) => handleProfileChange('confirmPassword', e.target.value)}
                  className={`w-full pl-10 pr-10 py-2 border rounded ${currentTheme.input}`}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => handlePasswordToggle('confirm')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
                  aria-label={showPasswords.confirm ? "Hide confirm password" : "Show confirm password"}
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`p-3 rounded ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isUpdating}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isUpdating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
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
            {[
              { key: 'morning', label: 'Morning', start: '09:00', end: '12:00' },
              { key: 'afternoon', label: 'Afternoon', start: '12:00', end: '17:00' },
              { key: 'evening', label: 'Evening', start: '17:00', end: '20:00' }
            ].map(({ key, label, start, end }) => (
              <label key={key} className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={user.preferences.preferredTimes.includes(key)}
                  onChange={(e) => handlePreferredTimeChange(key, e.target.checked)}
                />
                <span className={`text-sm ${currentTheme.text}`}>
                  {label} ({formatTime(start, user.preferences.timeFormat)} - {formatTime(end, user.preferences.timeFormat)})
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-semibold ${currentTheme.text}`}>Calendar Integration</h3>
            {isLoadingCalendars && (
              <RefreshCw className={`h-4 w-4 ${currentTheme.textSecondary} animate-spin`} />
            )}
          </div>

          {calendarError && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
              {calendarError}
            </div>
          )}

          <div className="space-y-3">
            {/* Google Calendar */}
            {googleIntegration ? (
              <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 p-3 ${theme === 'light' ? 'bg-blue-50 border-blue-200' : 'bg-blue-900 border-blue-700'} border rounded`}>
                <div className="flex items-center min-w-0">
                  <div className="w-8 h-8 bg-blue-500 rounded mr-3 flex-shrink-0 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19,4H18V2H16V4H8V2H6V4H5A2,2 0 0,0 3,6V20A2,2 0 0,0 5,22H19A2,2 0 0,0 21,20V6A2,2 0 0,0 19,4M19,20H5V10H19V20Z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className={`font-medium ${currentTheme.text} truncate`}>Google Calendar</p>
                    <p className={`text-xs sm:text-sm ${currentTheme.textSecondary} truncate`}>
                      {googleIntegration.accountEmail}
                    </p>
                    {googleIntegration.lastSync && (
                      <p className={`text-xs ${currentTheme.textMuted}`}>
                        Last synced: {new Date(googleIntegration.lastSync).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleDisconnectGoogle}
                  className="px-3 py-1.5 bg-red-100 text-red-600 text-xs sm:text-sm rounded hover:bg-red-200 transition-colors whitespace-nowrap"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectGoogle}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed ${currentTheme.border} rounded ${currentTheme.hover} ${currentTheme.text} transition-colors`}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,4H18V2H16V4H8V2H6V4H5A2,2 0 0,0 3,6V20A2,2 0 0,0 5,22H19A2,2 0 0,0 21,20V6A2,2 0 0,0 19,4M19,20H5V10H19V20Z" />
                </svg>
                Connect Google Calendar
              </button>
            )}

            {/* iCal/CalDAV */}
            {iCalIntegration ? (
              <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 p-3 ${theme === 'light' ? 'bg-purple-50 border-purple-200' : 'bg-purple-900 border-purple-700'} border rounded`}>
                <div className="flex items-center min-w-0">
                  <div className="w-8 h-8 bg-purple-500 rounded mr-3 flex-shrink-0 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className={`font-medium ${currentTheme.text} truncate`}>
                      {iCalIntegration.calendarName || 'iCal Calendar'}
                    </p>
                    <p className={`text-xs sm:text-sm ${currentTheme.textSecondary} truncate`}>
                      {iCalIntegration.accountEmail}
                    </p>
                    {iCalIntegration.lastSync && (
                      <p className={`text-xs ${currentTheme.textMuted}`}>
                        Last synced: {new Date(iCalIntegration.lastSync).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleDisconnectICal}
                  className="px-3 py-1.5 bg-red-100 text-red-600 text-xs sm:text-sm rounded hover:bg-red-200 transition-colors whitespace-nowrap"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowICalModal(true)}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed ${currentTheme.border} rounded ${currentTheme.hover} ${currentTheme.text} transition-colors`}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                </svg>
                Connect iCal/CalDAV
              </button>
            )}

            {calendarIntegrations.length === 0 && (
              <p className={`text-xs ${currentTheme.textMuted} text-center py-2`}>
                No calendars connected. Connect your calendar to sync events automatically.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Icon Picker Modal */}
      {showIconPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${currentTheme.cardBg} border ${currentTheme.border} rounded-lg p-6 max-w-md w-full mx-4`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${currentTheme.text}`}>Choose Profile Icon</h3>
              <button
                onClick={() => setShowIconPicker(false)}
                className={`p-1 rounded-full ${currentTheme.hover} transition-colors`}
                aria-label="Close icon picker"
              >
                <X className={`h-5 w-5 ${currentTheme.textSecondary}`} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {userIcons.map((icon) => (
                <button
                  key={icon.name}
                  onClick={() => handleIconSelect(icon.path)}
                  className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                    user.profileIcon === icon.path
                      ? 'border-blue-500 bg-blue-50'
                      : `border-gray-200 hover:border-blue-300 ${currentTheme.hover}`
                  }`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <img
                      src={icon.path}
                      alt={icon.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <span className={`text-xs font-medium ${currentTheme.text}`}>
                      {icon.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4">
              <button
                onClick={() => handleIconSelect('')}
                className={`w-full px-4 py-2 border ${currentTheme.border} rounded ${currentTheme.hover} ${currentTheme.text} transition-colors`}
              >
                Use Default (No Icon)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iCal Connection Modal */}
      {showICalModal && (
        <Suspense fallback={null}>
          <CalendarSyncModal
            isOpen={showICalModal}
            onClose={() => setShowICalModal(false)}
            onConnect={handleConnectICal}
            theme={theme}
          />
        </Suspense>
      )}
    </div>
  );
};

export default React.memo(Settings); 