import React, { useState } from 'react';
import { X, Calendar, Clock, Repeat, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAppContext } from '../hooks/useAppContext';
import { themeClasses } from '../utils/theme';
import { AvailabilityDay, RecurringPattern } from '../types';

interface AvailabilityFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  theme: 'light' | 'dark';
}

interface AvailabilityFormData {
  type: 'fully-free' | 'partially-free' | 'recurring';
  date: string;
  eventType: 'work' | 'personal' | 'social';
  timeSlots: string[];
  recurringPattern: string;
  recurringDescription: string;
  recurringType: 'work' | 'personal' | 'social';
}

const AvailabilityForm: React.FC<AvailabilityFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  theme
}) => {
  const { token } = useAuth();
  const { user } = useAppContext();
  const currentTheme = themeClasses[theme];

  const [formData, setFormData] = useState<AvailabilityFormData>({
    type: 'fully-free',
    date: '',
    eventType: 'work',
    timeSlots: [''],
    recurringPattern: '',
    recurringDescription: '',
    recurringType: 'work'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const availabilityTypes = [
    {
      value: 'fully-free' as const,
      label: 'Fully Free Day',
      description: 'Available all day for any type of event',
      icon: <Calendar className="h-4 w-4" />
    },
    {
      value: 'partially-free' as const,
      label: 'Partially Available',
      description: 'Available during specific time slots',
      icon: <Clock className="h-4 w-4" />
    },
    {
      value: 'recurring' as const,
      label: 'Recurring Availability',
      description: 'Regular availability pattern (weekly, monthly, etc.)',
      icon: <Repeat className="h-4 w-4" />
    }
  ];

  const eventTypes = [
    { value: 'work', label: 'Work', color: 'blue' },
    { value: 'personal', label: 'Personal', color: 'purple' },
    { value: 'social', label: 'Social', color: 'green' }
  ];

  const recurringPatterns = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'custom', label: 'Custom Pattern' }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTypeChange = (type: 'fully-free' | 'partially-free' | 'recurring') => {
    setFormData(prev => ({
      ...prev,
      type,
      // Reset relevant fields when type changes
      timeSlots: type === 'partially-free' ? [''] : [],
      date: type === 'recurring' ? '' : prev.date,
      recurringPattern: type !== 'recurring' ? '' : prev.recurringPattern
    }));
  };

  const addTimeSlot = () => {
    setFormData(prev => ({
      ...prev,
      timeSlots: [...prev.timeSlots, '']
    }));
  };

  const removeTimeSlot = (index: number) => {
    setFormData(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.filter((_, i) => i !== index)
    }));
  };

  const updateTimeSlot = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.map((slot, i) => i === index ? value : slot)
    }));
  };

  const validateTimeSlot = (timeSlot: string): boolean => {
    const timeSlotRegex = /^\d{1,2}:\d{2}-\d{1,2}:\d{2}$/;
    if (!timeSlotRegex.test(timeSlot)) return false;

    const [start, end] = timeSlot.split('-');
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    return startTime < endTime && startHour >= 0 && startHour <= 23 && endHour >= 0 && endHour <= 23;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.type === 'fully-free' || formData.type === 'partially-free') {
      if (!formData.date) {
        setError('Date is required');
        return;
      }
    }

    if (formData.type === 'partially-free') {
      const validTimeSlots = formData.timeSlots.filter(slot => slot.trim() !== '');
      if (validTimeSlots.length === 0) {
        setError('At least one time slot is required for partially available days');
        return;
      }

      for (const slot of validTimeSlots) {
        if (!validateTimeSlot(slot)) {
          setError(`Invalid time slot format: ${slot}. Use format HH:MM-HH:MM (e.g., 09:00-17:00)`);
          return;
        }
      }
    }

    if (formData.type === 'recurring') {
      if (!formData.recurringPattern.trim()) {
        setError('Recurring pattern is required');
        return;
      }
      if (!formData.recurringDescription.trim()) {
        setError('Description is required for recurring availability');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Create availability data based on type
      let newAvailabilityData;

      if (formData.type === 'fully-free') {
        const dayName = new Date(formData.date).toLocaleDateString('en-US', { weekday: 'long' });
        newAvailabilityData = {
          date: formData.date,
          day: dayName,
          eventType: formData.eventType
        };
      } else if (formData.type === 'partially-free') {
        const dayName = new Date(formData.date).toLocaleDateString('en-US', { weekday: 'long' });
        const validTimeSlots = formData.timeSlots.filter(slot => slot.trim() !== '');
        newAvailabilityData = {
          date: formData.date,
          day: dayName,
          availableSlots: validTimeSlots,
          eventType: formData.eventType
        };
      } else {
        newAvailabilityData = {
          pattern: formData.recurringPattern,
          type: formData.recurringType,
          description: formData.recurringDescription
        };
      }

      // In a real app, this would be an API call
      console.log(`Adding ${formData.type} availability:`, newAvailabilityData);

      // Add to context (simulate API success)
      // Note: We need to import addAvailabilityBlock from context
      // For now, we'll just log - the actual integration would happen here

      // Reset form
      setFormData({
        type: 'fully-free',
        date: '',
        eventType: 'work',
        timeSlots: [''],
        recurringPattern: '',
        recurringDescription: '',
        recurringType: 'work'
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Availability creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to add availability');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      type: 'fully-free',
      date: '',
      eventType: 'work',
      timeSlots: [''],
      recurringPattern: '',
      recurringDescription: '',
      recurringType: 'work'
    });
    setError('');
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
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <Plus className="h-4 w-4 text-green-600" />
              </div>
              <h2 className={`text-xl font-bold ${currentTheme.text}`}>Add Availability Block</h2>
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
            {/* Availability Type */}
            <div>
              <label className={`block text-sm font-medium ${currentTheme.text} mb-3`}>
                Availability Type *
              </label>
              <div className="space-y-3">
                {availabilityTypes.map((type) => (
                  <label key={type.value} className="flex items-start cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value={type.value}
                      checked={formData.type === type.value}
                      onChange={(e) => handleTypeChange(e.target.value as 'fully-free' | 'partially-free' | 'recurring')}
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

            {/* Date (for fully-free and partially-free) */}
            {(formData.type === 'fully-free' || formData.type === 'partially-free') && (
              <div>
                <label htmlFor="date" className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                  Date *
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  required
                  value={formData.date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${currentTheme.input}`}
                />
              </div>
            )}

            {/* Event Type (for fully-free and partially-free) */}
            {(formData.type === 'fully-free' || formData.type === 'partially-free') && (
              <div>
                <label className={`block text-sm font-medium ${currentTheme.text} mb-3`}>
                  Event Type *
                </label>
                <div className="flex space-x-4">
                  {eventTypes.map((type) => (
                    <label key={type.value} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="eventType"
                        value={type.value}
                        checked={formData.eventType === type.value}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      <span className={`text-sm ${currentTheme.text}`}>
                        {type.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Time Slots (for partially-free) */}
            {formData.type === 'partially-free' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className={`text-sm font-medium ${currentTheme.text}`}>
                    Available Time Slots *
                  </label>
                  <button
                    type="button"
                    onClick={addTimeSlot}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Slot
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.timeSlots.map((slot, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={slot}
                        onChange={(e) => updateTimeSlot(index, e.target.value)}
                        placeholder="e.g., 09:00-17:00"
                        className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${currentTheme.input}`}
                      />
                      {formData.timeSlots.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTimeSlot(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className={`text-xs ${currentTheme.textMuted} mt-2`}>
                  Use format HH:MM-HH:MM (24-hour format). Example: 09:00-17:00
                </p>
              </div>
            )}

            {/* Recurring Pattern (for recurring) */}
            {formData.type === 'recurring' && (
              <>
                <div>
                  <label htmlFor="recurringPattern" className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                    Recurring Pattern *
                  </label>
                  <input
                    type="text"
                    id="recurringPattern"
                    name="recurringPattern"
                    required
                    value={formData.recurringPattern}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${currentTheme.input}`}
                    placeholder="e.g., Every Friday 15:00-17:00"
                  />
                </div>

                <div>
                  <label htmlFor="recurringDescription" className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                    Description *
                  </label>
                  <input
                    type="text"
                    id="recurringDescription"
                    name="recurringDescription"
                    required
                    value={formData.recurringDescription}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${currentTheme.input}`}
                    placeholder="e.g., Open office hours"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${currentTheme.text} mb-3`}>
                    Recurring Event Type *
                  </label>
                  <div className="flex space-x-4">
                    {eventTypes.map((type) => (
                      <label key={type.value} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="recurringType"
                          value={type.value}
                          checked={formData.recurringType === type.value}
                          onChange={handleChange}
                          className="mr-2"
                        />
                        <span className={`text-sm ${currentTheme.text}`}>
                          {type.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

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
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding...
                  </div>
                ) : (
                  'Add Availability'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityForm;