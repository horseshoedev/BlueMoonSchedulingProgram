import React from 'react';
import { X, Calendar, Clock, Users, MapPin, Repeat, Tag, Edit, Trash2 } from 'lucide-react';
import { themeClasses } from '../utils/theme';
import { formatTimeSlot } from '../utils/time';
import { ScheduleEvent } from '../types';

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: ScheduleEvent | null;
  theme: 'light' | 'dark';
  timeFormat: '12' | '24';
  onEdit?: (event: ScheduleEvent) => void;
  onDelete?: (eventId: string) => void;
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({
  isOpen,
  onClose,
  event,
  theme,
  timeFormat,
  onEdit,
  onDelete
}) => {
  const currentTheme = themeClasses[theme];

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'work':
        return theme === 'light' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-blue-900 text-blue-300 border-blue-700';
      case 'personal':
        return theme === 'light' ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-purple-900 text-purple-300 border-purple-700';
      case 'social':
        return theme === 'light' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-green-900 text-green-300 border-green-700';
      default:
        return theme === 'light' ? 'bg-gray-100 text-gray-800 border-gray-200' : 'bg-gray-700 text-gray-300 border-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return theme === 'light' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-green-900 text-green-300 border-green-700';
      case 'pending':
        return theme === 'light' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-yellow-900 text-yellow-300 border-yellow-700';
      case 'cancelled':
        return theme === 'light' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-red-900 text-red-300 border-red-700';
      default:
        return theme === 'light' ? 'bg-gray-100 text-gray-800 border-gray-200' : 'bg-gray-700 text-gray-300 border-gray-600';
    }
  };

  const handleEdit = () => {
    if (event && onEdit) {
      onEdit(event);
      onClose();
    }
  };

  const handleDelete = () => {
    if (event && onDelete) {
      if (window.confirm(`Are you sure you want to delete "${event.title}"?`)) {
        onDelete(event.id);
        onClose();
      }
    }
  };

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className={`${currentTheme.cardBg} border ${currentTheme.border} rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 border-b ${currentTheme.border}`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h2 className={`text-2xl font-bold ${currentTheme.text}`}>{event.title}</h2>
                <span className={`px-3 py-1 text-sm rounded-full border capitalize ${getEventTypeColor(event.type)}`}>
                  <Tag className="h-3 w-3 inline mr-1" />
                  {event.type}
                </span>
                <span className={`px-3 py-1 text-sm rounded-full border capitalize ${getStatusColor(event.status)}`}>
                  {event.status}
                </span>
              </div>
              {event.groupName && (
                <p className={`text-sm ${currentTheme.textSecondary} flex items-center`}>
                  <Users className="h-4 w-4 mr-1" />
                  {event.groupName}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-full ${currentTheme.hover} transition-colors`}
            >
              <X className={`h-5 w-5 ${currentTheme.textSecondary}`} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          {event.description && (
            <div>
              <h3 className={`text-sm font-semibold ${currentTheme.text} mb-2`}>Description</h3>
              <p className={`text-sm ${currentTheme.textSecondary} leading-relaxed`}>
                {event.description}
              </p>
            </div>
          )}

          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg border ${currentTheme.border}`}>
              <div className={`flex items-center mb-2 ${currentTheme.textSecondary}`}>
                <Calendar className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Date</span>
              </div>
              <p className={`text-base font-semibold ${currentTheme.text}`}>
                {new Date(event.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            <div className={`p-4 rounded-lg border ${currentTheme.border}`}>
              <div className={`flex items-center mb-2 ${currentTheme.textSecondary}`}>
                <Clock className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Time</span>
              </div>
              <p className={`text-base font-semibold ${currentTheme.text}`}>
                {formatTimeSlot(`${event.startTime}-${event.endTime}`, timeFormat)}
              </p>
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className={`p-4 rounded-lg border ${currentTheme.border}`}>
              <div className={`flex items-center mb-2 ${currentTheme.textSecondary}`}>
                <MapPin className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Location</span>
              </div>
              <p className={`text-base ${currentTheme.text}`}>{event.location}</p>
            </div>
          )}

          {/* Recurring Pattern */}
          {event.isRecurring && event.recurringPattern && (
            <div className={`p-4 rounded-lg border ${currentTheme.border}`}>
              <div className={`flex items-center mb-2 ${currentTheme.textSecondary}`}>
                <Repeat className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Recurring Event</span>
              </div>
              <p className={`text-base ${currentTheme.text}`}>{event.recurringPattern}</p>
            </div>
          )}

          {/* Attendees */}
          {event.attendees && event.attendees.length > 0 && (
            <div>
              <div className={`flex items-center mb-3 ${currentTheme.text}`}>
                <Users className="h-4 w-4 mr-2" />
                <h3 className="text-sm font-semibold">Attendees ({event.attendees.length})</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {event.attendees.map((attendee, index) => (
                  <div
                    key={index}
                    className={`px-3 py-1.5 rounded-full text-sm border ${theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-700' : 'bg-gray-700 border-gray-600 text-gray-300'}`}
                  >
                    {attendee}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Event Metadata */}
          <div className={`pt-4 border-t ${currentTheme.border}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <span className={`${currentTheme.textMuted}`}>Created: </span>
                <span className={`${currentTheme.textSecondary}`}>
                  {new Date(event.createdAt).toLocaleString()}
                </span>
              </div>
              <div>
                <span className={`${currentTheme.textMuted}`}>Updated: </span>
                <span className={`${currentTheme.textSecondary}`}>
                  {new Date(event.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`p-6 border-t ${currentTheme.border} flex justify-between`}>
          <div className="flex space-x-3">
            {onEdit && (
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Event
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className={`px-4 py-2 border ${currentTheme.border} rounded ${currentTheme.text} ${currentTheme.hover} transition-colors`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventDetailModal;
