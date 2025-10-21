import React, { useState, lazy, Suspense, useMemo, useCallback } from 'react';
import { Calendar, Clock, Users, Plus, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppContext } from '../hooks/useAppContext';
import { themeClasses } from '../utils/theme';
import { formatTimeSlot } from '../utils/time';
import { ScheduleEvent } from '../types';

// Lazy load modal components
const ScheduleForm = lazy(() => import('./ScheduleForm'));
const EventDetailModal = lazy(() => import('./EventDetailModal'));

const Schedule: React.FC = () => {
  const { theme, user } = useAppContext();
  const currentTheme = themeClasses[theme];

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [filterType, setFilterType] = useState<string>('all');
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);

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

  const eventTypes = useMemo(() => ['all', 'work', 'personal', 'social'], []);

  const filteredEvents = useMemo(() => scheduleEvents.filter(event =>
    filterType === 'all' || event.type === filterType
  ), [scheduleEvents, filterType]);

  const formatDate = useCallback((date: Date) => {
    return date.toISOString().split('T')[0];
  }, []);

  const getWeekDates = useMemo(() => {
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
  }, [currentDate]);

  const getEventsForDate = useCallback((date: Date) => {
    const dateString = formatDate(date);
    return filteredEvents.filter(event => event.date === dateString);
  }, [filteredEvents, formatDate]);

  const navigate = useCallback((direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  }, [currentDate, viewMode]);

  const getMonthDates = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const dates = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      dates.push(null);
    }

    // Add all days in month
    for (let i = 1; i <= daysInMonth; i++) {
      dates.push(new Date(year, month, i));
    }

    return dates;
  }, [currentDate]);

  const getDisplayDateRange = useMemo(() => {
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } else if (viewMode === 'week') {
      return currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } else {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  }, [viewMode, currentDate]);

  const getEventTypeColor = useCallback((type: string) => {
    switch (type) {
      case 'work':
        return theme === 'light' ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-orange-900 text-orange-300 border-orange-700';
      case 'personal':
        return theme === 'light' ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-purple-900 text-purple-300 border-purple-700';
      case 'social':
        return theme === 'light' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-green-900 text-green-300 border-green-700';
      default:
        return theme === 'light' ? 'bg-gray-100 text-gray-800 border-gray-200' : 'bg-gray-700 text-gray-300 border-gray-600';
    }
  }, [theme]);

  const getDotColor = useCallback((type: string) => {
    switch (type) {
      case 'work':
        return 'bg-orange-500';
      case 'personal':
        return 'bg-purple-500';
      case 'social':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  }, []);

  const getUniqueEventTypes = useCallback((events: ScheduleEvent[]) => {
    const types = new Set(events.map(event => event.type));
    return Array.from(types);
  }, []);

  const getFilterButtonColor = useCallback((type: string, isActive: boolean) => {
    if (!isActive) {
      return theme === 'light'
        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        : 'bg-gray-700 text-gray-300 hover:bg-gray-600';
    }

    switch (type) {
      case 'work':
        return theme === 'light'
          ? 'bg-orange-100 text-orange-700 border border-orange-200'
          : 'bg-orange-900 text-orange-300 border border-orange-700';
      case 'personal':
        return theme === 'light'
          ? 'bg-purple-100 text-purple-700 border border-purple-200'
          : 'bg-purple-900 text-purple-300 border border-purple-700';
      case 'social':
        return theme === 'light'
          ? 'bg-green-100 text-green-700 border border-green-200'
          : 'bg-green-900 text-green-300 border border-green-700';
      default: // 'all'
        return theme === 'light'
          ? 'bg-blue-100 text-blue-700 border border-blue-200'
          : 'bg-blue-900 text-blue-300 border border-blue-700';
    }
  }, [theme]);

  const handleCreateEvent = useCallback(() => {
    setShowScheduleForm(true);
  }, []);

  const handleEventCreated = useCallback((event: ScheduleEvent) => {
    // In a real app, this would update the context/state
    console.log('Event created:', event);
    setShowScheduleForm(false);
  }, []);

  const handleEventClick = useCallback((event: ScheduleEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  }, []);

  const handleCloseEventModal = useCallback(() => {
    setShowEventModal(false);
    setSelectedEvent(null);
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <h2 className={`text-lg sm:text-xl font-bold ${currentTheme.text}`}>Schedule</h2>
        <button
          onClick={handleCreateEvent}
          className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center transition-colors text-sm"
        >
          <Plus className="h-4 w-4 sm:mr-2" />
          <span>New Event</span>
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <Filter className={`h-4 w-4 ${currentTheme.textSecondary}`} />
            <span className={`text-xs sm:text-sm font-medium ${currentTheme.text}`}>Filter:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {eventTypes.map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full capitalize transition-colors ${
                  getFilterButtonColor(type, filterType === type)
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => navigate('prev')}
            className={`p-2 rounded ${currentTheme.hover} transition-colors`}
            aria-label={`Previous ${viewMode}`}
          >
            <ChevronLeft className={`h-4 w-4 ${currentTheme.textSecondary}`} />
          </button>
          <span className={`text-xs sm:text-sm font-medium ${currentTheme.text} min-w-[140px] sm:min-w-[180px] text-center`}>
            {getDisplayDateRange}
          </span>
          <button
            onClick={() => navigate('next')}
            className={`p-2 rounded ${currentTheme.hover} transition-colors`}
            aria-label={`Next ${viewMode}`}
          >
            <ChevronRight className={`h-4 w-4 ${currentTheme.textSecondary}`} />
          </button>
        </div>
      </div>

      {/* View Mode Switcher */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setViewMode('day')}
          className={`px-3 sm:px-4 py-2 text-xs sm:text-sm rounded transition-colors ${
            viewMode === 'day'
              ? `${theme === 'light' ? 'bg-blue-600 text-white' : 'bg-blue-700 text-white'}`
              : `${theme === 'light' ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`
          }`}
        >
          Day
        </button>
        <button
          onClick={() => setViewMode('week')}
          className={`px-3 sm:px-4 py-2 text-xs sm:text-sm rounded transition-colors ${
            viewMode === 'week'
              ? `${theme === 'light' ? 'bg-blue-600 text-white' : 'bg-blue-700 text-white'}`
              : `${theme === 'light' ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`
          }`}
        >
          Week
        </button>
        <button
          onClick={() => setViewMode('month')}
          className={`px-3 sm:px-4 py-2 text-xs sm:text-sm rounded transition-colors ${
            viewMode === 'month'
              ? `${theme === 'light' ? 'bg-blue-600 text-white' : 'bg-blue-700 text-white'}`
              : `${theme === 'light' ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`
          }`}
        >
          Month
        </button>
      </div>

      {/* Day View */}
      {viewMode === 'day' && (
        <div className={`${currentTheme.cardBg} border ${currentTheme.border} rounded-lg p-4`}>
          <div className="space-y-3">
            {getEventsForDate(currentDate).length > 0 ? (
              getEventsForDate(currentDate).map((event) => (
                <div
                  key={event.id}
                  onClick={() => handleEventClick(event)}
                  className={`p-4 border ${currentTheme.border} rounded-lg cursor-pointer hover:shadow-md transition-shadow ${currentTheme.hover}`}
                >
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
                          <Clock className="h-4 w-4 mr-1" />
                          {formatTimeSlot(`${event.startTime}-${event.endTime}`, user.preferences.timeFormat)}
                        </div>
                        {event.groupName && (
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {event.groupName}
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {event.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={`text-center py-8 ${currentTheme.textSecondary}`}>
                No events scheduled for this day
              </div>
            )}
          </div>
        </div>
      )}

      {/* Week View - Horizontal scroll on mobile */}
      {viewMode === 'week' && (
        <div className={`${currentTheme.cardBg} border ${currentTheme.border} rounded-lg overflow-x-auto`}>
          <div className="grid grid-cols-7 border-b ${currentTheme.border} min-w-[700px]">
            {getWeekDates.map((date, index) => {
              const isToday = formatDate(date) === formatDate(new Date());
              const dayEvents = getEventsForDate(date);

              return (
                <div key={index} className={`p-2 sm:p-4 border-r ${currentTheme.border} last:border-r-0`}>
                  <div className="text-center">
                    <div className={`text-xs sm:text-sm ${currentTheme.textSecondary}`}>
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className={`text-base sm:text-lg font-semibold ${isToday ? 'text-blue-600' : currentTheme.text} ${isToday ? 'bg-blue-100 rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center mx-auto mt-1' : ''}`}>
                      {date.getDate()}
                    </div>
                    {/* Event type indicators */}
                    {dayEvents.length > 0 && (
                      <div className="flex justify-center gap-1 mt-1">
                        {getUniqueEventTypes(dayEvents).map((type) => (
                          <div
                            key={type}
                            className={`w-1.5 h-1.5 rounded-full ${getDotColor(type)}`}
                            title={type}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-2 sm:mt-3 space-y-1">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        onClick={() => handleEventClick(event)}
                        className={`p-1.5 sm:p-2 rounded text-xs border cursor-pointer hover:opacity-90 transition-opacity ${getEventTypeColor(event.type)}`}
                      >
                        <div className="font-medium break-words">{event.title}</div>
                        <div className="flex items-start mt-1">
                          <Clock className="h-3 w-3 mr-1 flex-shrink-0 mt-0.5" />
                          <span className="text-[10px] sm:text-xs break-words flex-1">
                            {formatTimeSlot(`${event.startTime}-${event.endTime}`, user.preferences.timeFormat)}
                          </span>
                        </div>
                        {event.groupName && (
                          <div className="flex items-start mt-1">
                            <Users className="h-3 w-3 mr-1 flex-shrink-0 mt-0.5" />
                            <span className="break-words text-[10px] sm:text-xs flex-1">{event.groupName}</span>
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
      )}

      {/* Month View */}
      {viewMode === 'month' && (
        <div className={`${currentTheme.cardBg} border ${currentTheme.border} rounded-lg overflow-hidden`}>
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b ${currentTheme.border}">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className={`p-2 text-center text-xs sm:text-sm font-semibold ${currentTheme.text} border-r ${currentTheme.border} last:border-r-0`}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {getMonthDates.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className={`min-h-[80px] sm:min-h-[100px] border-r border-b ${currentTheme.border} last:border-r-0`}></div>;
              }

              const isToday = formatDate(date) === formatDate(new Date());
              const dayEvents = getEventsForDate(date);
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();

              return (
                <div
                  key={index}
                  className={`min-h-[80px] sm:min-h-[100px] p-1 sm:p-2 border-r border-b ${currentTheme.border} last:border-r-0 ${!isCurrentMonth ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-1">
                    <div className={`text-xs sm:text-sm font-medium ${isToday ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : currentTheme.text}`}>
                      {date.getDate()}
                    </div>
                    {/* Event type indicators */}
                    {dayEvents.length > 0 && (
                      <div className="flex gap-0.5">
                        {getUniqueEventTypes(dayEvents).map((type) => (
                          <div
                            key={type}
                            className={`w-1.5 h-1.5 rounded-full ${getDotColor(type)}`}
                            title={type}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-1 space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        onClick={() => handleEventClick(event)}
                        className={`px-1 py-0.5 rounded text-[10px] sm:text-xs border truncate cursor-pointer hover:opacity-90 transition-opacity ${getEventTypeColor(event.type)}`}
                        title={`${event.title} (${event.startTime}-${event.endTime})`}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className={`text-[10px] ${currentTheme.textSecondary} px-1`}>
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Events List */}
      <div className={`${currentTheme.cardBg} border ${currentTheme.border} rounded-lg p-4`}>
        <h3 className={`text-lg font-semibold ${currentTheme.text} mb-4`}>Upcoming Events</h3>
        <div className="space-y-3">
          {filteredEvents.slice(0, 5).map((event) => (
            <div
              key={event.id}
              onClick={() => handleEventClick(event)}
              className={`p-3 border ${currentTheme.border} rounded-lg cursor-pointer hover:shadow-md transition-shadow ${currentTheme.hover}`}
            >
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
                      {formatTimeSlot(`${event.startTime}-${event.endTime}`, user.preferences.timeFormat)}
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
      {showScheduleForm && (
        <Suspense fallback={null}>
          <ScheduleForm
            isOpen={showScheduleForm}
            onClose={() => setShowScheduleForm(false)}
            onSuccess={handleEventCreated}
            theme={theme}
          />
        </Suspense>
      )}

      {/* Event Detail Modal */}
      {showEventModal && (
        <Suspense fallback={null}>
          <EventDetailModal
            isOpen={showEventModal}
            onClose={handleCloseEventModal}
            event={selectedEvent}
            theme={theme}
            timeFormat={user.preferences.timeFormat}
          />
        </Suspense>
      )}
    </div>
  );
};

export default React.memo(Schedule);