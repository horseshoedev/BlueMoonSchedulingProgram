import React, { useMemo, useCallback } from 'react';
import { Calendar, Clock, Users, Bell, ChevronRight } from 'lucide-react';
import { useAppContext } from '../hooks/useAppContext';
import { themeClasses } from '../utils/theme';

const Dashboard: React.FC = () => {
  const { availabilityData, groups, invitations, setInvitations, setActiveTab, theme, joinGroup } = useAppContext();
  const currentTheme = themeClasses[theme];

  const handleAcceptInvitation = useCallback((invitationId: number) => {
    const invitation = invitations.find(inv => inv.id === invitationId);
    if (invitation) {
      // Find the group by name and join it
      const groupToJoin = groups.find(group => group.name === invitation.group);
      if (groupToJoin) {
        joinGroup(groupToJoin.id);
      }
      // Remove the invitation from the list
      setInvitations(invitations.filter(inv => inv.id !== invitationId));
    }
  }, [invitations, groups, joinGroup, setInvitations]);

  const handleDeclineInvitation = useCallback((invitationId: number) => {
    // Remove the invitation from the list
    setInvitations(invitations.filter(inv => inv.id !== invitationId));
  }, [invitations, setInvitations]);

  const stats = useMemo(() => [
    {
      label: 'Fully Free Days',
      value: availabilityData.fullyFree.length,
      icon: <Calendar className="h-8 w-8 text-green-600" />,
      color: 'green'
    },
    {
      label: 'Partially Available',
      value: availabilityData.partiallyFree.length,
      icon: <Clock className="h-8 w-8 text-blue-600" />,
      color: 'blue'
    },
    {
      label: 'Active Groups',
      value: groups.length,
      icon: <Users className="h-8 w-8 text-purple-600" />,
      color: 'purple'
    }
  ], [availabilityData.fullyFree.length, availabilityData.partiallyFree.length, groups.length]);

  const joinedGroups = useMemo(() => groups.filter(group => group.isJoined), [groups]);

  const getGroupTypeColor = useCallback((type: string) => {
    switch (type) {
      case 'work':
        return theme === 'light'
          ? 'bg-orange-100 text-orange-800 border border-orange-200'
          : 'bg-orange-900 text-orange-300 border border-orange-700';
      case 'personal':
        return theme === 'light'
          ? 'bg-purple-100 text-purple-800 border border-purple-200'
          : 'bg-purple-900 text-purple-300 border border-purple-700';
      case 'social':
        return theme === 'light'
          ? 'bg-green-100 text-green-800 border border-green-200'
          : 'bg-green-900 text-green-300 border border-green-700';
      default:
        return theme === 'light'
          ? 'bg-gray-100 text-gray-800 border border-gray-200'
          : 'bg-gray-700 text-gray-300 border border-gray-600';
    }
  }, [theme]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {stats.map((stat, index) => (
          <div key={index} className={`${theme === 'light' ? `bg-${stat.color}-50 border-${stat.color}-200` : `bg-${stat.color}-900 border-${stat.color}-700`} border rounded-lg p-3 sm:p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${theme === 'light' ? `text-${stat.color}-600` : `text-${stat.color}-400`} text-xs sm:text-sm font-medium`}>
                  {stat.label}
                </p>
                <p className={`text-xl sm:text-2xl font-bold ${theme === 'light' ? `text-${stat.color}-800` : `text-${stat.color}-300`}`}>
                  {stat.value}
                </p>
              </div>
              <div className="scale-75 sm:scale-100">
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className={`${theme === 'light' ? 'bg-yellow-50 border-yellow-200' : 'bg-yellow-900 border-yellow-700'} border rounded-lg p-3 sm:p-4`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm sm:text-base font-semibold ${theme === 'light' ? 'text-yellow-800' : 'text-yellow-300'} flex items-center`}>
              <Bell className="h-4 w-4 mr-2" />
              Pending Invitations ({invitations.length})
            </h3>
          </div>
          <div className="space-y-2">
            {invitations.map(invite => (
              <div key={invite.id} className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 ${currentTheme.cardBg} p-3 rounded border ${currentTheme.border}`}>
                <div className="min-w-0">
                  <p className={`font-medium ${currentTheme.text} truncate`}>{invite.from}</p>
                  <p className={`text-xs sm:text-sm ${currentTheme.textSecondary} truncate`}>{invite.group} • {invite.type}</p>
                </div>
                <div className="flex gap-2 sm:gap-2 sm:flex-shrink-0">
                  <button
                    onClick={() => handleAcceptInvitation(invite.id)}
                    className="flex-1 sm:flex-none px-3 py-1 bg-green-600 text-white text-xs sm:text-sm rounded hover:bg-green-700 transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleDeclineInvitation(invite.id)}
                    className="flex-1 sm:flex-none px-3 py-1 bg-gray-300 text-gray-700 text-xs sm:text-sm rounded hover:bg-gray-400 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Groups */}
      <div className={`${currentTheme.cardBg} border ${currentTheme.border} rounded-lg p-4`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-base sm:text-lg font-semibold ${currentTheme.text}`}>
            My Groups
          </h3>
          <button
            onClick={() => setActiveTab('groups')}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center transition-colors"
          >
            View All <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {joinedGroups.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {joinedGroups.map(group => (
              <div
                key={group.id}
                onClick={() => setActiveTab('groups')}
                className={`p-3 border ${currentTheme.border} rounded-lg ${currentTheme.hover} transition-shadow cursor-pointer`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className={`font-medium ${currentTheme.text} text-sm flex-1`}>{group.name}</h4>
                  <span className={`px-2 py-0.5 text-xs rounded capitalize ${getGroupTypeColor(group.type)}`}>
                    {group.type}
                  </span>
                </div>
                <div className={`flex items-center gap-3 text-xs ${currentTheme.textSecondary}`}>
                  <span className="flex items-center">
                    <Users className="h-3 w-3 mr-1" />
                    {group.members} members
                  </span>
                  <span className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {group.lastActive}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className={`h-12 w-12 mx-auto mb-3 ${currentTheme.textMuted} opacity-50`} />
            <p className={`${currentTheme.textSecondary} mb-2`}>
              You haven't joined any groups yet
            </p>
            <button
              onClick={() => setActiveTab('groups')}
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              Browse Groups
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(Dashboard); 