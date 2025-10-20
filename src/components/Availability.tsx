import React, { useState, lazy, Suspense } from 'react';
import { Plus, CheckCircle, Circle, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { useAppContext } from '../hooks/useAppContext';
import { themeClasses } from '../utils/theme';
import { formatTimeSlot } from '../utils/time';

// Lazy load form component
const AvailabilityForm = lazy(() => import('./AvailabilityForm'));

const Availability: React.FC = () => {
  const { availabilityData, user, theme } = useAppContext();
  const currentTheme = themeClasses[theme];

  // Collapsible state
  const [fullyFreeOpen, setFullyFreeOpen] = useState(true);
  const [partiallyFreeOpen, setPartiallyFreeOpen] = useState(true);
  const [recurringOpen, setRecurringOpen] = useState(true);

  // Filter state
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  // Form state
  const [showAvailabilityForm, setShowAvailabilityForm] = useState(false);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFilter(e.target.value);
  };

  const handleAddBlock = () => {
    setShowAvailabilityForm(true);
  };

  const handleAvailabilityAdded = () => {
    // In a real app, this would refresh the availability data from the context/API
    console.log('Availability block added successfully');
    setShowAvailabilityForm(false);
  };

  // Filter availability data based on selected event type
  const getFilteredData = () => {
    if (selectedFilter === 'all') {
      return availabilityData;
    }

    return {
      fullyFree: availabilityData.fullyFree.filter(day => day.eventType === selectedFilter),
      partiallyFree: availabilityData.partiallyFree.filter(day => day.eventType === selectedFilter),
      recurring: availabilityData.recurring.filter(pattern => pattern.type === selectedFilter)
    };
  };

  const filteredData = getFilteredData();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <h2 className={`text-lg sm:text-xl font-bold ${currentTheme.text}`}>My Availability</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={selectedFilter}
            onChange={handleFilterChange}
            className={`px-3 py-2 border rounded text-xs sm:text-sm ${currentTheme.input}`}
          >
            <option value="all">All Event Types</option>
            <option value="work">Work Only</option>
            <option value="social">Social Only</option>
            <option value="personal">Personal Only</option>
          </select>
          <button
            onClick={handleAddBlock}
            className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center transition-colors text-sm"
          >
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="sm:inline">Add Block</span>
          </button>
        </div>
      </div>

      {/* Fully Free Days */}
      <div className={`${currentTheme.cardBg} border ${currentTheme.border} rounded-lg p-4`}>
        <button
          className="w-full flex items-center justify-between mb-3"
          onClick={() => setFullyFreeOpen((open) => !open)}
          aria-label={fullyFreeOpen ? "Collapse fully free days section" : "Expand fully free days section"}
        >
          <span className={`font-semibold ${theme === 'light' ? 'text-green-700' : 'text-green-400'} flex items-center`}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Fully Free Days
          </span>
          {fullyFreeOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        {fullyFreeOpen && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {filteredData.fullyFree.map((day, idx) => (
              <div key={idx} className={`${theme === 'light' ? 'bg-green-50 border-green-200' : 'bg-green-900 border-green-700'} border rounded p-2 sm:p-3`}>
                <p className={`font-medium text-sm sm:text-base ${theme === 'light' ? 'text-green-800' : 'text-green-300'}`}>{day.day}</p>
                <p className={`text-xs sm:text-sm ${theme === 'light' ? 'text-green-600' : 'text-green-400'}`}>{day.date}</p>
                <p className={`text-xs ${theme === 'light' ? 'text-green-500' : 'text-green-500'} mt-1`}>All day available</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Partially Free Days */}
      <div className={`${currentTheme.cardBg} border ${currentTheme.border} rounded-lg p-4`}>
        <button
          className="w-full flex items-center justify-between mb-3"
          onClick={() => setPartiallyFreeOpen((open) => !open)}
          aria-label={partiallyFreeOpen ? "Collapse partially available days section" : "Expand partially available days section"}
        >
          <span className={`font-semibold ${theme === 'light' ? 'text-blue-700' : 'text-blue-400'} flex items-center`}>
            <Circle className="h-4 w-4 mr-2" />
            Partially Available Days
          </span>
          {partiallyFreeOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        {partiallyFreeOpen && (
          <div className="space-y-3">
            {filteredData.partiallyFree.map((day, idx) => (
              <div key={idx} className={`${theme === 'light' ? 'bg-blue-50 border-blue-200' : 'bg-blue-900 border-blue-700'} border rounded p-3`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className={`font-medium ${theme === 'light' ? 'text-blue-800' : 'text-blue-300'}`}>{day.day}</p>
                    <p className={`text-sm ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`}>{day.date}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {day.availableSlots?.map((slot, slotIdx) => (
                    <span key={slotIdx} className={`px-2 py-1 ${theme === 'light' ? 'bg-blue-100 text-blue-700' : 'bg-blue-800 text-blue-300'} text-xs rounded`}>
                      {formatTimeSlot(slot, user.preferences.timeFormat)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recurring Availability */}
      <div className={`${currentTheme.cardBg} border ${currentTheme.border} rounded-lg p-4`}>
        <button
          className="w-full flex items-center justify-between mb-3"
          onClick={() => setRecurringOpen((open) => !open)}
          aria-label={recurringOpen ? "Collapse recurring availability section" : "Expand recurring availability section"}
        >
          <span className={`font-semibold ${theme === 'light' ? 'text-purple-700' : 'text-purple-400'} flex items-center`}>
            <Clock className="h-4 w-4 mr-2" />
            Recurring Availability
          </span>
          {recurringOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        {recurringOpen && (
          <div className="space-y-3">
            {filteredData.recurring.map((pattern, idx) => (
              <div key={idx} className={`${theme === 'light' ? 'bg-purple-50 border-purple-200' : 'bg-purple-900 border-purple-700'} border rounded p-3`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-medium ${theme === 'light' ? 'text-purple-800' : 'text-purple-300'}`}>{pattern.pattern}</p>
                    <p className={`text-sm ${theme === 'light' ? 'text-purple-600' : 'text-purple-400'}`}>{pattern.description}</p>
                  </div>
                  <span className={`px-2 py-1 ${theme === 'light' ? 'bg-purple-100 text-purple-700' : 'bg-purple-800 text-purple-300'} text-xs rounded capitalize`}>
                    {pattern.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Availability Form Modal */}
      {showAvailabilityForm && (
        <Suspense fallback={null}>
          <AvailabilityForm
            isOpen={showAvailabilityForm}
            onClose={() => setShowAvailabilityForm(false)}
            onSuccess={handleAvailabilityAdded}
            theme={theme}
          />
        </Suspense>
      )}
    </div>
  );
};

export default Availability;