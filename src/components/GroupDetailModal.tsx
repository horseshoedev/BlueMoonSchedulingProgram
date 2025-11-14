import React, { useState } from 'react';
import { X, Users, Calendar, Clock, MapPin, User, Crown, Settings, UserMinus, MessageSquare, Send, ChevronDown } from 'lucide-react';
import { themeClasses } from '../utils/theme';
import { Group, ScheduleEvent } from '../types';
import ProposeMeetingModal from './ProposeMeetingModal';

interface GroupDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group | null;
  theme: 'light' | 'dark';
  onScheduleMeeting: (groupId: number | string, groupName: string) => void;
  onLeaveGroup: (groupId: number | string) => void;
}

const GroupDetailModal: React.FC<GroupDetailModalProps> = ({
  isOpen,
  onClose,
  group,
  theme,
  onScheduleMeeting,
  onLeaveGroup
}) => {
  const currentTheme = themeClasses[theme];
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'events' | 'options'>('overview');
  const [showScheduleDropdown, setShowScheduleDropdown] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);

  // Mock data for group members - in a real app this would come from API
  const mockMembers = [
    { id: '1', name: 'Sarah Kim', role: 'admin', joinedDate: '2025-01-15', isOnline: true },
    { id: '2', name: 'Alex Chen', role: 'member', joinedDate: '2025-02-01', isOnline: false },
    { id: '3', name: 'Mike Johnson', role: 'member', joinedDate: '2025-02-10', isOnline: true },
    { id: '4', name: 'Emma Davis', role: 'member', joinedDate: '2025-03-05', isOnline: false },
    { id: '5', name: 'James Wilson', role: 'moderator', joinedDate: '2025-01-20', isOnline: true }
  ];

  // Mock upcoming events for this group
  const mockUpcomingEvents: ScheduleEvent[] = [
    {
      id: '1',
      title: 'Weekly Team Standup',
      description: 'Regular team sync and planning meeting',
      startTime: '09:00',
      endTime: '10:00',
      date: '2025-09-26',
      type: 'work',
      groupId: group?.id.toString() || '',
      groupName: group?.name || '',
      attendees: ['Sarah Kim', 'Alex Chen', 'Mike Johnson'],
      location: 'Conference Room A',
      status: 'scheduled',
      createdBy: '1',
      createdAt: '2025-09-20T10:00:00Z',
      updatedAt: '2025-09-20T10:00:00Z'
    },
    {
      id: '2',
      title: 'Project Review',
      description: 'Review current project progress and next steps',
      startTime: '14:00',
      endTime: '15:30',
      date: '2025-09-28',
      type: 'work',
      groupId: group?.id.toString() || '',
      groupName: group?.name || '',
      attendees: ['Sarah Kim', 'Emma Davis', 'James Wilson'],
      location: 'Virtual Meeting',
      status: 'scheduled',
      createdBy: '1',
      createdAt: '2025-09-22T15:00:00Z',
      updatedAt: '2025-09-22T15:00:00Z'
    }
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'work':
        return theme === 'light' ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-orange-900 text-orange-300 border-orange-700';
      case 'personal':
        return theme === 'light' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-purple-900 text-purple-300 border-purple-700';
      case 'social':
        return theme === 'light' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-green-900 text-green-300 border-green-700';
      default:
        return theme === 'light' ? 'bg-gray-100 text-gray-700 border-gray-200' : 'bg-gray-700 text-gray-300 border-gray-600';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'moderator':
        return <Settings className="h-4 w-4 text-orange-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleLeaveGroup = () => {
    setShowLeaveConfirmation(true);
  };

  const confirmLeaveGroup = () => {
    if (group) {
      onLeaveGroup(group.id);
      setShowLeaveConfirmation(false);
      onClose();
    }
  };

  const cancelLeaveGroup = () => {
    setShowLeaveConfirmation(false);
  };

  const handleScheduleMeeting = () => {
    if (group) {
      onScheduleMeeting(group.id, group.name);
      onClose();
    }
  };

  const handleProposeMeeting = () => {
    setShowScheduleDropdown(false);
    setShowProposalModal(true);
  };

  const handleCloseProposalModal = () => {
    setShowProposalModal(false);
  };

  if (!isOpen || !group) return null;

  const nextMeeting = mockUpcomingEvents[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${currentTheme.cardBg} border ${currentTheme.border} rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden`}>
        {/* Header */}
        <div className={`p-6 border-b ${currentTheme.border}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-full ${getTypeColor(group.type)}`}>
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${currentTheme.text}`}>{group.name}</h2>
                <div className="flex items-center space-x-3 mt-1">
                  <span className={`px-2 py-1 text-xs rounded capitalize border ${getTypeColor(group.type)}`}>
                    {group.type}
                  </span>
                  <span className={`text-sm ${currentTheme.textSecondary}`}>
                    {group.members} members
                  </span>
                  <span className={`text-sm ${currentTheme.textSecondary}`}>
                    Active {group.lastActive}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-full ${currentTheme.hover} transition-colors`}
            >
              <X className={`h-5 w-5 ${currentTheme.textSecondary}`} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`border-b ${currentTheme.border}`}>
          <div className="flex">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'members', label: 'Members' },
              { key: 'events', label: 'Events' },
              { key: 'options', label: 'Options' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as 'overview' | 'members' | 'events' | 'options')}
                className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : `border-transparent ${currentTheme.textSecondary} hover:${currentTheme.text}`
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h3 className={`text-lg font-semibold ${currentTheme.text} mb-3`}>About This Group</h3>
                <p className={`text-sm ${currentTheme.textSecondary} leading-relaxed`}>
                  {group.description || 'No description available for this group.'}
                </p>
              </div>

              {/* Next Meeting */}
              {nextMeeting && (
                <div>
                  <h3 className={`text-lg font-semibold ${currentTheme.text} mb-3`}>Next Scheduled Meeting</h3>
                  <div className={`p-4 border ${currentTheme.border} rounded-lg ${getTypeColor(nextMeeting.type)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className={`font-medium ${currentTheme.text}`}>{nextMeeting.title}</h4>
                        {nextMeeting.description && (
                          <p className={`text-sm ${currentTheme.textSecondary} mt-1`}>
                            {nextMeeting.description}
                          </p>
                        )}
                        <div className={`flex items-center space-x-4 mt-3 text-sm ${currentTheme.textSecondary}`}>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            {new Date(nextMeeting.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            {nextMeeting.startTime} - {nextMeeting.endTime}
                          </div>
                          {nextMeeting.location && (
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2" />
                              {nextMeeting.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div>
                <h3 className={`text-lg font-semibold ${currentTheme.text} mb-3`}>Group Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`p-4 rounded-lg border ${currentTheme.border} text-center`}>
                    <div className={`text-2xl font-bold ${currentTheme.text}`}>{group.members}</div>
                    <div className={`text-xs ${currentTheme.textSecondary}`}>Members</div>
                  </div>
                  <div className={`p-4 rounded-lg border ${currentTheme.border} text-center`}>
                    <div className={`text-2xl font-bold ${currentTheme.text}`}>{mockUpcomingEvents.length}</div>
                    <div className={`text-xs ${currentTheme.textSecondary}`}>Upcoming Events</div>
                  </div>
                  <div className={`p-4 rounded-lg border ${currentTheme.border} text-center`}>
                    <div className={`text-2xl font-bold text-green-500`}>3</div>
                    <div className={`text-xs ${currentTheme.textSecondary}`}>Online Now</div>
                  </div>
                  <div className={`p-4 rounded-lg border ${currentTheme.border} text-center`}>
                    <div className={`text-2xl font-bold ${currentTheme.text}`}>12</div>
                    <div className={`text-xs ${currentTheme.textSecondary}`}>Total Events</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-semibold ${currentTheme.text}`}>Group Members</h3>
                <span className={`text-sm ${currentTheme.textSecondary}`}>
                  {mockMembers.length} members
                </span>
              </div>

              <div className="space-y-3">
                {mockMembers.map(member => (
                  <div key={member.id} className={`p-4 border ${currentTheme.border} rounded-lg`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium`}>
                            {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </div>
                          {member.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className={`font-medium ${currentTheme.text}`}>{member.name}</span>
                            {getRoleIcon(member.role)}
                          </div>
                          <div className={`text-sm ${currentTheme.textSecondary}`}>
                            {member.role} • Joined {new Date(member.joinedDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          className={`p-2 rounded ${currentTheme.hover} transition-colors`}
                          title="Message member"
                        >
                          <MessageSquare className={`h-4 w-4 ${currentTheme.textSecondary}`} />
                        </button>
                        {member.role !== 'admin' && (
                          <button
                            className={`p-2 rounded text-red-500 hover:bg-red-50 transition-colors`}
                            title="Remove member"
                          >
                            <UserMinus className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-semibold ${currentTheme.text}`}>Upcoming Events</h3>
                {/* Schedule Meeting Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowScheduleDropdown(!showScheduleDropdown)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center text-sm"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Meeting
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </button>

                  {showScheduleDropdown && (
                    <div className={`absolute top-full mt-2 right-0 ${currentTheme.cardBg} border ${currentTheme.border} rounded-lg shadow-lg py-2 min-w-[200px] z-10`}>
                      <button
                        onClick={() => {
                          setShowScheduleDropdown(false);
                          handleScheduleMeeting();
                        }}
                        className={`w-full px-4 py-2 text-left ${currentTheme.text} ${currentTheme.hover} flex items-center`}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Now
                      </button>
                      <button
                        onClick={handleProposeMeeting}
                        className={`w-full px-4 py-2 text-left ${currentTheme.text} ${currentTheme.hover} flex items-center`}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Propose Time via Email
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {mockUpcomingEvents.map(event => (
                  <div key={event.id} className={`p-4 border ${currentTheme.border} rounded-lg`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className={`font-medium ${currentTheme.text}`}>{event.title}</h4>
                        {event.description && (
                          <p className={`text-sm ${currentTheme.textSecondary} mt-1`}>
                            {event.description}
                          </p>
                        )}
                        <div className={`flex items-center space-x-4 mt-3 text-sm ${currentTheme.textSecondary}`}>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            {new Date(event.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            {event.startTime} - {event.endTime}
                          </div>
                          {event.location && (
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2" />
                              {event.location}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${getTypeColor(event.type)}`}>
                        {event.type}
                      </span>
                    </div>
                  </div>
                ))}

                {mockUpcomingEvents.length === 0 && (
                  <div className={`text-center py-8 ${currentTheme.textSecondary}`}>
                    <Calendar className="h-8 w-8 mx-auto mb-3 opacity-50" />
                    <p>No upcoming events scheduled</p>
                    <button
                      onClick={() => {
                        setShowScheduleDropdown(true);
                      }}
                      className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Schedule the first event
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'options' && (
            <div className="space-y-6">
              <div>
                <h3 className={`text-lg font-semibold ${currentTheme.text} mb-3`}>Group Options</h3>
                <p className={`text-sm ${currentTheme.textSecondary} mb-6`}>
                  Manage your membership and group settings.
                </p>
              </div>

              {/* Leave Group Section */}
              <div className={`p-4 border ${currentTheme.border} rounded-lg`}>
                <h4 className={`font-medium ${currentTheme.text} mb-2`}>Leave Group</h4>
                <p className={`text-sm ${currentTheme.textSecondary} mb-4`}>
                  Remove yourself from this group. You will no longer have access to group events and will need to be re-invited to rejoin.
                </p>
                <button
                  onClick={handleLeaveGroup}
                  className="px-4 py-2 text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors"
                >
                  Leave Group
                </button>
              </div>
            </div>
          )}
        </div>


        {/* Proposal Modal */}
        {group && (
          <ProposeMeetingModal
            isOpen={showProposalModal}
            onClose={handleCloseProposalModal}
            groupId={group.id}
            groupName={group.name}
            theme={theme}
            memberEmails={mockMembers.map(m => m.name.toLowerCase().replace(' ', '.') + '@example.com')}
          />
        )}
      </div>

      {/* Leave Group Confirmation Modal */}
      {showLeaveConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className={`${currentTheme.cardBg} border ${currentTheme.border} rounded-lg w-full max-w-md p-6`}>
            <h3 className={`text-xl font-bold ${currentTheme.text} mb-4`}>Leave Group?</h3>
            <p className={`${currentTheme.textSecondary} mb-6`}>
              Are you sure you want to leave <span className={`font-semibold ${currentTheme.text}`}>{group?.name}</span>?
              You will no longer have access to group events and will need to be re-invited to rejoin.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                onClick={cancelLeaveGroup}
                className={`w-full sm:w-auto px-4 py-2 border ${currentTheme.border} rounded ${currentTheme.text} ${currentTheme.hover} transition-colors`}
              >
                No, Stay in Group
              </button>
              <button
                onClick={confirmLeaveGroup}
                className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Yes, Leave Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDetailModal;