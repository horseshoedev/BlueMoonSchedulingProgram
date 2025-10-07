import React, { useState } from 'react';
import { Plus, Users, Clock, Calendar, Share2, UserPlus, UserMinus, Filter, Eye } from 'lucide-react';
import { useAppContext } from '../hooks/useAppContext';
import { themeClasses } from '../utils/theme';
import GroupForm from './GroupForm';
import GroupDetailModal from './GroupDetailModal';
import { Group } from '../types';

const Groups: React.FC = () => {
  const { groups, theme, joinGroup, leaveGroup, addGroup, setActiveTab } = useAppContext();
  const currentTheme = themeClasses[theme];
  const [filterType, setFilterType] = useState<string>('all');
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showGroupDetail, setShowGroupDetail] = useState(false);

  const handleJoinLeave = (groupId: number | string, isJoined: boolean) => {
    if (isJoined) {
      leaveGroup(groupId);
    } else {
      joinGroup(groupId);
    }
  };

  const filteredGroups = groups.filter(group => 
    filterType === 'all' || group.type === filterType
  );

  const groupTypes = ['all', 'work', 'personal', 'social'];

  const handleCreateGroup = () => {
    setShowGroupForm(true);
  };

  const handleGroupCreated = (group: Group) => {
    addGroup(group);
  };

  const handleScheduleMeeting = (_groupId: number | string, _groupName: string) => {
    // Navigate to schedule tab and open scheduling form for this group
    setActiveTab('schedule');
    // In a more complex implementation, we could pass group data via context or state
    // For now, we'll just navigate to the schedule tab where users can create events
  };

  const handleShareGroup = (groupName: string) => {
    // For now, just show an alert - this would open a sharing interface
    alert(`Share ${groupName} - this would open a sharing interface or copy invite link`);
  };

  const handleViewDetails = (group: Group) => {
    setSelectedGroup(group);
    setShowGroupDetail(true);
  };

  const handleCloseGroupDetail = () => {
    setShowGroupDetail(false);
    setSelectedGroup(null);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <h2 className={`text-lg sm:text-xl font-bold ${currentTheme.text}`}>Groups & Sharing</h2>
        <button
          onClick={handleCreateGroup}
          className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center transition-colors text-sm"
        >
          <Plus className="h-4 w-4 sm:mr-2" />
          <span>Create Group</span>
        </button>
      </div>

      {/* Filter Section */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2">
          <Filter className={`h-4 w-4 ${currentTheme.textSecondary}`} />
          <span className={`text-xs sm:text-sm font-medium ${currentTheme.text}`}>Filter by type:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {groupTypes.map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full capitalize transition-colors ${
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filteredGroups.map(group => (
          <div key={group.id} className={`${currentTheme.cardBg} border ${currentTheme.border} rounded-lg p-4 hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`font-semibold ${currentTheme.text}`}>{group.name}</h3>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 ${theme === 'light' ? 'bg-gray-100 text-gray-600' : 'bg-gray-700 text-gray-300'} text-xs rounded capitalize`}>
                  {group.type}
                </span>
                {group.isJoined && (
                  <span className={`px-2 py-1 ${theme === 'light' ? 'bg-green-100 text-green-600' : 'bg-green-900 text-green-300'} text-xs rounded`}>
                    Joined
                  </span>
                )}
              </div>
            </div>
            
            {group.description && (
              <p className={`text-sm ${currentTheme.textSecondary} mb-3 line-clamp-2`}>
                {group.description}
              </p>
            )}
            
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
            
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => handleJoinLeave(group.id, group.isJoined || false)}
                className={`w-full sm:w-auto sm:flex-1 px-3 py-2 rounded flex items-center justify-center transition-colors text-sm whitespace-nowrap ${
                  group.isJoined
                    ? `${theme === 'light' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-red-900 text-red-300 hover:bg-red-800'}`
                    : `${theme === 'light' ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-green-900 text-green-300 hover:bg-green-800'}`
                }`}
              >
                {group.isJoined ? (
                  <>
                    <UserMinus className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Leave Group</span>
                    <span className="sm:hidden">Leave</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Join Group</span>
                    <span className="sm:hidden">Join</span>
                  </>
                )}
              </button>
              <div className="flex gap-2 flex-1 flex-wrap min-w-[200px]">
                <button
                  onClick={() => handleViewDetails(group)}
                  className={`flex-1 min-w-[80px] px-2 sm:px-3 py-2 ${theme === 'light' ? 'bg-purple-50 text-purple-600 hover:bg-purple-100' : 'bg-purple-900 text-purple-300 hover:bg-purple-800'} rounded flex items-center justify-center transition-colors text-sm whitespace-nowrap`}
                  title="View group details"
                >
                  <Eye className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Details</span>
                </button>
                <button
                  onClick={() => handleScheduleMeeting(group.id, group.name)}
                  className={`flex-1 min-w-[80px] px-2 sm:px-3 py-2 ${theme === 'light' ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-blue-900 text-blue-300 hover:bg-blue-800'} rounded flex items-center justify-center transition-colors text-sm whitespace-nowrap`}
                >
                  <Calendar className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Schedule</span>
                </button>
                <button
                  onClick={() => handleShareGroup(group.name)}
                  className={`px-2 sm:px-3 py-2 min-w-[40px] ${theme === 'light' ? 'bg-gray-50 text-gray-600 hover:bg-gray-100' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'} rounded transition-colors flex items-center justify-center whitespace-nowrap`}
                  title="Share group"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Group Creation Form Modal */}
      <GroupForm
        isOpen={showGroupForm}
        onClose={() => setShowGroupForm(false)}
        onSuccess={handleGroupCreated}
        theme={theme}
      />

      {/* Group Detail Modal */}
      <GroupDetailModal
        isOpen={showGroupDetail}
        onClose={handleCloseGroupDetail}
        group={selectedGroup}
        theme={theme}
        onScheduleMeeting={handleScheduleMeeting}
        onLeaveGroup={leaveGroup}
      />
    </div>
  );
};

export default Groups; 