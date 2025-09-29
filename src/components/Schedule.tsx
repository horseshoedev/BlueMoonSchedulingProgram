import React, { useState } from 'react';
import { Calendar, Clock, Users, Plus, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppContext } from '../hooks/useAppContext';
import { themeClasses } from '../utils/theme';
import { ScheduleEvent } from '../types';
import ScheduleForm from './ScheduleForm';

const Schedule: React.FC = () => {
  const { theme, user } = useAppContext();
  const currentTheme = themeClasses[theme];

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [filterType, setFilterType] = useState<string>('all');
  const [showScheduleForm, setShowScheduleForm] = useState(false);

  // Mock schedule data - in a real app this would come from context/API
  const [scheduleEvents] = useState<ScheduleEvent[]>([
    {
      id: '1',
      title: 'Team Standup',
      description: 'Daily team sync meeting',
      startTime: '09:00',
      endTime: '09:30',
      date: '2025-09-25',
      type: 'work',
      groupId: '1',
      groupName: 'Marketing Team',
      attendees: ['Sarah Kim', 'Alex Chen', 'Mike Johnson'],
      status: 'scheduled',
      createdBy: user.id,
      createdAt: '2025-09-20T10:00:00Z',
      updatedAt: '2025-09-20T10:00:00Z'
    },
    {
      id: '2',
      title: 'Book Club Discussion',
      description: 'Discussing "The Great Gatsby"',
      startTime: '19:00',
      endTime: '20:30',
      date: '2025-09-26',
      type: 'social',
      groupId: '3',
      groupName: 'Book Club',
      attendees: ['Alice Smith', 'Bob Wilson', 'Carol Brown'],
      location: 'Central Library',
      status: 'scheduled',
      createdBy: user.id,
      createdAt: '2025-09-21T15:00:00Z',
      updatedAt: '2025-09-21T15:00:00Z'
    },
    {
      id: '3',
      title: 'Family Dinner',
      description: 'Weekly family gathering',
      startTime: '18:00',
      endTime: '20:00',
      date: '2025-09-28',
      type: 'personal',
      groupId: '2',
      groupName: 'Family',
      attendees: ['Mom', 'Dad', 'Sister'],
      location: 'Home',
      isRecurring: true,
      recurringPattern: 'Weekly on Sunday',
      status: 'scheduled',
      createdBy: user.id,
      createdAt: '2025-09-22T12:00:00Z',
      updatedAt: '2025-09-22T12:00:00Z'
    }
  ]);

  const eventTypes = ['all', 'work', 'personal', 'social'];

  const filteredEvents = scheduleEvents.filter(event =>
    filterType === 'all' || event.type === filterType
  );

  const getWeekDates = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getEventsForDate = (date: Date) => {
    const dateString = formatDate(date);
    return filteredEvents.filter(event => event.date === dateString);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

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

  const handleCreateEvent = () => {
    setShowScheduleForm(true);
  };

  const handleEventCreated = (event: ScheduleEvent) => {
    // In a real app, this would update the context/state
    console.log('Event created:', event);
    setShowScheduleForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className={`text-xl font-bold ${currentTheme.text}`}>Schedule</h2>
        <button
          onClick={handleCreateEvent}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Event
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className={`h-4 w-4 ${currentTheme.textSecondary}`} />
            <span className={`text-sm font-medium ${currentTheme.text}`}>Filter:</span>
          </div>
          <div className="flex space-x-2">
            {eventTypes.map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 text-sm rounded-full capitalize transition-colors ${
                  filterType === type
                    ? `${theme === 'light' ? 'bg-blue-100 text-blue-700' : 'bg-blue-900 text-blue-300'}`
                    : `${theme === 'light' ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateWeek('prev')}
              className={`p-2 rounded ${currentTheme.hover} transition-colors`}
            >
              <ChevronLeft className={`h-4 w-4 ${currentTheme.textSecondary}`} />
            </button>
            <span className={`text-sm font-medium ${currentTheme.text} min-w-[120px] text-center`}>
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={() => navigateWeek('next')}
              className={`p-2 rounded ${currentTheme.hover} transition-colors`}
            >
              <ChevronRight className={`h-4 w-4 ${currentTheme.textSecondary}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Week View */}
      <div className={`${currentTheme.cardBg} border ${currentTheme.border} rounded-lg overflow-hidden`}>
        <div className="grid grid-cols-7 border-b ${currentTheme.border}">
          {getWeekDates().map((date, index) => {
            const isToday = formatDate(date) === formatDate(new Date());
            const dayEvents = getEventsForDate(date);

            return (
              <div key={index} className={`p-4 border-r ${currentTheme.border} last:border-r-0`}>
                <div className="text-center">
                  <div className={`text-sm ${currentTheme.textSecondary}`}>
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className={`text-lg font-semibold ${isToday ? 'text-blue-600' : currentTheme.text} ${isToday ? 'bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center mx-auto mt-1' : ''}`}>
                    {date.getDate()}
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`p-2 rounded text-xs border ${getEventTypeColor(event.type)}`}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      <div className="flex items-center mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        {event.startTime}-{event.endTime}
                      </div>
                      {event.groupName && (
                        <div className="flex items-center mt-1">
                          <Users className="h-3 w-3 mr-1" />
                          <span className="truncate">{event.groupName}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Events List */}
      <div className={`${currentTheme.cardBg} border ${currentTheme.border} rounded-lg p-4`}>
        <h3 className={`text-lg font-semibold ${currentTheme.text} mb-4`}>Upcoming Events</h3>
        <div className="space-y-3">
          {filteredEvents.slice(0, 5).map((event) => (
            <div key={event.id} className={`p-3 border ${currentTheme.border} rounded-lg`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className={`font-medium ${currentTheme.text}`}>{event.title}</h4>
                    <span className={`px-2 py-1 text-xs rounded ${getEventTypeColor(event.type)}`}>
                      {event.type}
                    </span>
                  </div>

                  {event.description && (
                    <p className={`text-sm ${currentTheme.textSecondary} mt-1`}>
                      {event.description}
                    </p>
                  )}

                  <div className={`flex items-center space-x-4 mt-2 text-sm ${currentTheme.textSecondary}`}>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(event.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {event.startTime}-{event.endTime}
                    </div>
                    {event.groupName && (
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {event.groupName}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule Form Modal */}
      <ScheduleForm
        isOpen={showScheduleForm}
        onClose={() => setShowScheduleForm(false)}
        onSuccess={handleEventCreated}
        theme={theme}
      />
    </div>
  );
};

export default Schedule;