import React, { useState } from 'react';
import { X, Users, Lock, Globe, UserPlus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { themeClasses } from '../utils/theme';
import { Group } from '../types';

interface GroupFormData {
  name: string;
  description: string;
  type: 'public' | 'private' | 'invite-only';
}

interface GroupFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (group: Group) => void;
  theme: 'light' | 'dark';
}

const GroupForm: React.FC<GroupFormProps> = ({ isOpen, onClose, onSuccess, theme }) => {
  const { token } = useAuth();
  const currentTheme = themeClasses[theme];

  const [formData, setFormData] = useState<GroupFormData>({
    name: '',
    description: '',
    type: 'private'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const groupTypes = [
    {
      value: 'private' as const,
      label: 'Private',
      description: 'Only members can see this group',
      icon: <Lock className="h-4 w-4" />
    },
    {
      value: 'public' as const,
      label: 'Public',
      description: 'Anyone can see and join this group',
      icon: <Globe className="h-4 w-4" />
    },
    {
      value: 'invite-only' as const,
      label: 'Invite Only',
      description: 'Only invited members can join',
      icon: <UserPlus className="h-4 w-4" />
    }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!formData.name.trim()) {
      setError('Group name is required');
      return;
    }

    if (formData.name.trim().length < 2) {
      setError('Group name must be at least 2 characters long');
      return;
    }

    if (formData.name.trim().length > 100) {
      setError('Group name must be less than 100 characters');
      return;
    }

    if (formData.description.length > 500) {
      setError('Description must be less than 500 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          type: formData.type
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create group');
      }

      const data = await response.json();
      console.log('Group created successfully:', data);

      // Reset form
      setFormData({
        name: '',
        description: '',
        type: 'private'
      });

      onSuccess(data.group);
      onClose();
    } catch (err) {
      console.error('Group creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create group');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      type: 'private'
    });
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${currentTheme.cardBg} border ${currentTheme.border} rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <h2 className={`text-xl font-bold ${currentTheme.text}`}>Create New Group</h2>
            </div>
            <button
              onClick={handleClose}
              className={`p-1 rounded-full ${currentTheme.hover} transition-colors`}
            >
              <X className={`h-5 w-5 ${currentTheme.textSecondary}`} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Group Name */}
            <div>
              <label htmlFor="name" className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                Group Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                maxLength={100}
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${currentTheme.input}`}
                placeholder="Enter group name"
              />
              <p className={`text-xs ${currentTheme.textMuted} mt-1`}>
                {formData.name.length}/100 characters
              </p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                maxLength={500}
                value={formData.description}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${currentTheme.input}`}
                placeholder="Describe your group's purpose..."
              />
              <p className={`text-xs ${currentTheme.textMuted} mt-1`}>
                {formData.description.length}/500 characters
              </p>
            </div>

            {/* Group Type */}
            <div>
              <label className={`block text-sm font-medium ${currentTheme.text} mb-3`}>
                Group Type *
              </label>
              <div className="space-y-3">
                {groupTypes.map((type) => (
                  <label key={type.value} className="flex items-start cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value={type.value}
                      checked={formData.type === type.value}
                      onChange={handleChange}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex items-center">
                        {type.icon}
                        <span className={`ml-2 font-medium ${currentTheme.text}`}>
                          {type.label}
                        </span>
                      </div>
                      <p className={`text-sm ${currentTheme.textSecondary} mt-1`}>
                        {type.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className={`flex-1 px-4 py-2 border ${currentTheme.border} rounded-md ${currentTheme.text} ${currentTheme.hover} transition-colors`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.name.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </div>
                ) : (
                  'Create Group'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GroupForm;