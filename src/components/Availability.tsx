import React from 'react';
import { Plus, CheckCircle, Circle, Clock } from 'lucide-react';
import { useAppContext } from '../hooks/useAppContext';
import { themeClasses } from '../utils/theme';
import { formatTimeSlot } from '../utils/time';

const Availability: React.FC = () => {
  const { availabilityData, user, theme } = useAppContext();
  const currentTheme = themeClasses[theme];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-xl font-bold ${currentTheme.text}`}>My Availability</h2>
        <div className="flex space-x-2">
          <select className={`px-3 py-2 border rounded text-sm ${currentTheme.input}`}>
            <option>All Event Types</option>
            <option>Work Only</option>
            <option>Social Only</option>
            <option>Personal Only</option>
          </select>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Add Block
          </button>
        </div>
      </div>

      {/* Fully Free Days */}
      <div className={`${currentTheme.cardBg} border ${currentTheme.border} rounded-lg p-4`}>
        <h3 className={`font-semibold ${theme === 'light' ? 'text-green-700' : 'text-green-400'} mb-3 flex items-center`}>
          <CheckCircle className="h-4 w-4 mr-2" />
          Fully Free Days
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {availabilityData.fullyFree.map((day, idx) => (
            <div key={idx} className={`${theme === 'light' ? 'bg-green-50 border-green-200' : 'bg-green-900 border-green-700'} border rounded p-3`}>
              <p className={`font-medium ${theme === 'light' ? 'text-green-800' : 'text-green-300'}`}>{day.day}</p>
              <p className={`text-sm ${theme === 'light' ? 'text-green-600' : 'text-green-400'}`}>{day.date}</p>
              <p className={`text-xs ${theme === 'light' ? 'text-green-500' : 'text-green-500'} mt-1`}>All day available</p>
            </div>
          ))}
        </div>
      </div>

      {/* Partially Free Days */}
      <div className={`${currentTheme.cardBg} border ${currentTheme.border} rounded-lg p-4`}>
        <h3 className={`font-semibold ${theme === 'light' ? 'text-blue-700' : 'text-blue-400'} mb-3 flex items-center`}>
          <Circle className="h-4 w-4 mr-2" />
          Partially Available Days
        </h3>
        <div className="space-y-3">
          {availabilityData.partiallyFree.map((day, idx) => (
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
      </div>

      {/* Recurring Availability */}
      <div className={`${currentTheme.cardBg} border ${currentTheme.border} rounded-lg p-4`}>
        <h3 className={`font-semibold ${theme === 'light' ? 'text-purple-700' : 'text-purple-400'} mb-3 flex items-center`}>
          <Clock className="h-4 w-4 mr-2" />
          Recurring Availability
        </h3>
        <div className="space-y-3">
          {availabilityData.recurring.map((pattern, idx) => (
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
      </div>
    </div>
  );
};

export default Availability; 