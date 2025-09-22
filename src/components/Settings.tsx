import React, { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { useAuth } from '../hooks/useAuth';
import { themeClasses } from '../utils/theme';
import { formatTime } from '../utils/time';
import { User, Mail, Lock, Camera, Save, Eye, EyeOff, X } from 'lucide-react';
import ProfilePicture from './ProfilePicture';

const Settings: React.FC = () => {
  const { user, setUser, theme, setTheme } = useAppContext();
  const { user: authUser } = useAuth();
  const currentTheme = themeClasses[theme];
  
  // Available user icons
  const userIcons = [
    { name: 'Sol', path: '/images/userIcons/solUserIcon.png' },
    { name: 'Mercury', path: '/images/userIcons/mercuryUserIcon.png' },
    { name: 'Mars', path: '/images/userIcons/marsUserIcon.png' },
    { name: 'Jupiter', path: '/images/userIcons/jupiterUserIcon.png' },
    { name: 'Saturn', path: '/images/userIcons/saturnUserIcon.png' }
  ];

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

  const handleProfileChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordToggle = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleIconSelect = (iconPath: string) => {
    setUser({
      ...user,
      profileIcon: iconPath
    });
    setShowIconPicker(false);
  };

  const handleOpenIconPicker = () => {
    setShowIconPicker(true);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
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
  };

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

  const handlePreferredTimeChange = (timeSlot: string, checked: boolean) => {
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
  };

  const handleDisconnectCalendar = () => {
    // For now, just show an alert - this would disconnect from Google Calendar
    alert('Disconnect Google Calendar - this would remove calendar integration');
  };

  const handleAddCalendar = () => {
    // For now, just show an alert - this would open calendar connection flow
    alert('Add Calendar - this would open the calendar integration setup');
  };

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
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
              { key: 'morning', label: 'Morning (9-12)' },
              { key: 'afternoon', label: 'Afternoon (12-17)' },
              { key: 'evening', label: 'Evening (17-20)' }
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={user.preferences.preferredTimes.includes(key)}
                  onChange={(e) => handlePreferredTimeChange(key, e.target.checked)}
                />
                <span className={`text-sm ${currentTheme.text}`}>{label}</span>
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
              <button
                onClick={handleDisconnectCalendar}
                className="px-3 py-1 bg-red-100 text-red-600 text-sm rounded hover:bg-red-200 transition-colors"
              >
                Disconnect
              </button>
            </div>
            <button
              onClick={handleAddCalendar}
              className={`w-full px-4 py-2 border ${currentTheme.border} rounded ${currentTheme.hover} ${currentTheme.text} transition-colors`}
            >
              + Add Calendar
            </button>
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
    </div>
  );
};

export default Settings; 