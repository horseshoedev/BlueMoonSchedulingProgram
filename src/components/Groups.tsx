import React from 'react';
import { Plus, Users, Clock, Calendar, Share2 } from 'lucide-react';
import { useAppContext } from '../hooks/useAppContext';
import { themeClasses } from '../utils/theme';

const Groups: React.FC = () => {
  const { groups, theme } = useAppContext();
  const currentTheme = themeClasses[theme];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-xl font-bold ${currentTheme.text}`}>Groups & Sharing</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Create Group
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map(group => (
          <div key={group.id} className={`${currentTheme.cardBg} border ${currentTheme.border} rounded-lg p-4 hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`font-semibold ${currentTheme.text}`}>{group.name}</h3>
              <span className={`px-2 py-1 ${theme === 'light' ? 'bg-gray-100 text-gray-600' : 'bg-gray-700 text-gray-300'} text-xs rounded capitalize`}>
                {group.type}
              </span>
            </div>
            <div className={`space-y-2 text-sm ${currentTheme.textSecondary}`}>
              <p className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                {group.members} members
              </p>
              <p className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Active {group.lastActive}
              </p>
            </div>
            <div className="mt-4 flex space-x-2">
              <button className={`flex-1 px-3 py-2 ${theme === 'light' ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-blue-900 text-blue-300 hover:bg-blue-800'} rounded flex items-center justify-center`}>
                <Calendar className="h-4 w-4 mr-1" />
                View Schedule
              </button>
              <button className={`px-3 py-2 ${theme === 'light' ? 'bg-gray-50 text-gray-600 hover:bg-gray-100' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'} rounded`}>
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Groups; 