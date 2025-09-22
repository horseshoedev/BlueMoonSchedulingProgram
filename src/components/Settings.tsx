import React, { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { useAuth } from '../hooks/useAuth';
import { themeClasses } from '../utils/theme';
import { formatTime } from '../utils/time';
import { User, Mail, Lock, Camera, Save, Eye, EyeOff } from 'lucide-react';
import ProfilePicture from './ProfilePicture';

const Settings: React.FC = () => {
  const { user, setUser, theme, setTheme } = useAppContext();
  const { user: authUser } = useAuth();
  const currentTheme = themeClasses[theme];
  
  // Profile state
  const [profileData, setProfileData] = useState({
    name: authUser?.name || user.name,
    email: authUser?.email || user.email,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    profilePicture: null as File | null
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleProfileChange = (field: string, value: string | File | null) => {
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

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProfileChange('profilePicture', file);
    }
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
      setUser(prev => ({
        ...prev,
        name: profileData.name,
        email: profileData.email
      }));

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
                />
                <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors">
                  <Camera className="h-4 w-4 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                  />
                </label>
              </div>
              <div>
                <p className={`text-sm ${currentTheme.textSecondary}`}>
                  Click the camera icon to upload a new profile picture
                </p>
                {profileData.profilePicture && (
                  <p className={`text-xs ${currentTheme.textMuted}`}>
                    Selected: {profileData.profilePicture.name}
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