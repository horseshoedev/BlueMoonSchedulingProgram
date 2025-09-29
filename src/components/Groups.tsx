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

  const handleScheduleMeeting = (groupId: number | string, groupName: string) => {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-xl font-bold ${currentTheme.text}`}>Groups & Sharing</h2>
        <button
          onClick={handleCreateGroup}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Group
        </button>
      </div>

      {/* Filter Section */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Filter className={`h-4 w-4 ${currentTheme.textSecondary}`} />
          <span className={`text-sm font-medium ${currentTheme.text}`}>Filter by type:</span>
        </div>
        <div className="flex space-x-2">
          {groupTypes.map(type => (
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <p className={`text-sm ${currentTheme.textSecondary} mb-3`}>
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
            
            <div className="mt-4 flex space-x-2">
              <button
                onClick={() => handleJoinLeave(group.id, group.isJoined || false)}
                className={`flex-1 px-3 py-2 rounded flex items-center justify-center transition-colors ${
                  group.isJoined
                    ? `${theme === 'light' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-red-900 text-red-300 hover:bg-red-800'}`
                    : `${theme === 'light' ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-green-900 text-green-300 hover:bg-green-800'}`
                }`}
              >
                {group.isJoined ? (
                  <>
                    <UserMinus className="h-4 w-4 mr-1" />
                    Leave Group
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-1" />
                    Join Group
                  </>
                )}
              </button>
              <button
                onClick={() => handleViewDetails(group)}
                className={`px-3 py-2 ${theme === 'light' ? 'bg-purple-50 text-purple-600 hover:bg-purple-100' : 'bg-purple-900 text-purple-300 hover:bg-purple-800'} rounded flex items-center justify-center transition-colors`}
                title="View group details"
              >
                <Eye className="h-4 w-4 mr-1" />
                Details
              </button>
              <button
                onClick={() => handleScheduleMeeting(group.id, group.name)}
                className={`px-3 py-2 ${theme === 'light' ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-blue-900 text-blue-300 hover:bg-blue-800'} rounded flex items-center justify-center transition-colors`}
              >
                <Calendar className="h-4 w-4 mr-1" />
                Schedule
              </button>
              <button
                onClick={() => handleShareGroup(group.name)}
                className={`px-3 py-2 ${theme === 'light' ? 'bg-gray-50 text-gray-600 hover:bg-gray-100' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'} rounded transition-colors`}
                title="Share group"
              >
                <Share2 className="h-4 w-4" />
              </button>
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