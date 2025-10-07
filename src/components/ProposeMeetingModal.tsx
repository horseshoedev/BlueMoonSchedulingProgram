import React, { useState } from 'react';
import { X, Calendar, Clock, Mail, Send, Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { themeClasses } from '../utils/theme';
import { ProposeMeetingData } from '../types';

interface ProposeMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string | number;
  groupName: string;
  theme: 'light' | 'dark';
  memberEmails?: string[]; // Optional: pre-filled member emails
}

const ProposeMeetingModal: React.FC<ProposeMeetingModalProps> = ({
  isOpen,
  onClose,
  groupId,
  groupName,
  theme,
  memberEmails = []
}) => {
  const { token } = useAuth();
  const currentTheme = themeClasses[theme];

  const [formData, setFormData] = useState<ProposeMeetingData>({
    groupId,
    groupName,
    title: '',
    description: '',
    proposedDate: '',
    proposedTime: '',
    memberEmails: memberEmails
  });

  const [emailInput, setEmailInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddEmail = () => {
    const email = emailInput.trim();
    if (!email) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (formData.memberEmails.includes(email)) {
      setError('This email is already in the list');
      return;
    }

    setFormData(prev => ({
      ...prev,
      memberEmails: [...prev.memberEmails, email]
    }));
    setEmailInput('');
    setError('');
  };

  const handleRemoveEmail = (email: string) => {
    setFormData(prev => ({
      ...prev,
      memberEmails: prev.memberEmails.filter(e => e !== email)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.title.trim()) {
      setError('Meeting title is required');
      return;
    }

    if (!formData.proposedDate) {
      setError('Date is required');
      return;
    }

    if (!formData.proposedTime) {
      setError('Time is required');
      return;
    }

    if (formData.memberEmails.length === 0) {
      setError('At least one email address is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/meetings/propose`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to send proposal');
      }

      setSuccess(true);

      // Reset form after short delay
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      console.error('Proposal error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send proposal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      groupId,
      groupName,
      title: '',
      description: '',
      proposedDate: '',
      proposedTime: '',
      memberEmails: memberEmails
    });
    setEmailInput('');
    setError('');
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${currentTheme.cardBg} border ${currentTheme.border} rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                <Send className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${currentTheme.text}`}>
                  Propose Meeting Time
                </h2>
                <p className={`text-sm ${currentTheme.textSecondary}`}>
                  For {groupName}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className={`p-1 rounded-full ${currentTheme.hover} transition-colors`}
            >
              <X className={`h-5 w-5 ${currentTheme.textSecondary}`} />
            </button>
          </div>

          {success ? (
            <div className="py-8 text-center">
              <div className="text-5xl mb-4">✅</div>
              <h3 className={`text-xl font-semibold ${currentTheme.text} mb-2`}>
                Proposal Sent!
              </h3>
              <p className={`${currentTheme.textSecondary}`}>
                Emails have been sent to all group members
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Meeting Title */}
              <div>
                <label htmlFor="title" className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                  Meeting Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${currentTheme.input}`}
                  placeholder="e.g., DnD Session Planning"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${currentTheme.input}`}
                  placeholder="Additional details about the meeting..."
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="proposedDate" className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Proposed Date *
                  </label>
                  <input
                    type="date"
                    id="proposedDate"
                    name="proposedDate"
                    required
                    value={formData.proposedDate}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${currentTheme.input}`}
                  />
                </div>
                <div>
                  <label htmlFor="proposedTime" className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                    <Clock className="h-4 w-4 inline mr-1" />
                    Proposed Time *
                  </label>
                  <input
                    type="time"
                    id="proposedTime"
                    name="proposedTime"
                    required
                    value={formData.proposedTime}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${currentTheme.input}`}
                  />
                </div>
              </div>

              {/* Member Emails */}
              <div>
                <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                  <Users className="h-4 w-4 inline mr-1" />
                  Send To (Member Emails) *
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddEmail();
                      }
                    }}
                    className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${currentTheme.input}`}
                    placeholder="member@example.com"
                  />
                  <button
                    type="button"
                    onClick={handleAddEmail}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                  </button>
                </div>

                {/* Email list */}
                {formData.memberEmails.length > 0 && (
                  <div className={`p-3 border ${currentTheme.border} rounded-md space-y-2`}>
                    {formData.memberEmails.map((email, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-2 ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-700'} rounded`}
                      >
                        <span className={`text-sm ${currentTheme.text}`}>{email}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveEmail(email)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <p className={`text-xs ${currentTheme.textMuted} mt-2`}>
                      {formData.memberEmails.length} recipient{formData.memberEmails.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>

              {/* Info Box */}
              <div className={`p-4 rounded-md ${theme === 'light' ? 'bg-blue-50 border-blue-200' : 'bg-blue-900 border-blue-700'} border`}>
                <p className={`text-sm ${theme === 'light' ? 'text-blue-800' : 'text-blue-300'}`}>
                  💡 Each member will receive an email with options to: <strong>Yes</strong>, <strong>No</strong>, or <strong>Propose Alternate Time</strong>
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-md bg-red-50 border border-red-200 p-4">
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
                  disabled={isSubmitting || !formData.title.trim() || formData.memberEmails.length === 0}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Proposal
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProposeMeetingModal;
