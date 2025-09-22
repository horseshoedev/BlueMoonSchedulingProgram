import React from 'react';
import { Calendar, Clock, Users, Bell, ChevronRight } from 'lucide-react';
import { useAppContext } from '../hooks/useAppContext';
import { themeClasses } from '../utils/theme';

const Dashboard: React.FC = () => {
  const { availabilityData, groups, invitations, setInvitations, setActiveTab, theme, joinGroup } = useAppContext();
  const currentTheme = themeClasses[theme];

  const handleAcceptInvitation = (invitationId: number) => {
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
  };

  const handleDeclineInvitation = (invitationId: number) => {
    // Remove the invitation from the list
    setInvitations(invitations.filter(inv => inv.id !== invitationId));
  };

  const stats = [
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
  ];

  const quickActions = [
    {
      title: 'View My Availability',
      description: 'See your free and partially free days',
      icon: <Calendar className="h-5 w-5 text-blue-600 mr-3" />,
      action: () => setActiveTab('availability'),
      color: 'blue'
    },
    {
      title: 'Manage Groups',
      description: 'Invite others and view shared availability',
      icon: <Users className="h-5 w-5 text-purple-600 mr-3" />,
      action: () => setActiveTab('groups'),
      color: 'purple'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className={`${theme === 'light' ? `bg-${stat.color}-50 border-${stat.color}-200` : `bg-${stat.color}-900 border-${stat.color}-700`} border rounded-lg p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${theme === 'light' ? `text-${stat.color}-600` : `text-${stat.color}-400`} text-sm font-medium`}>
                  {stat.label}
                </p>
                <p className={`text-2xl font-bold ${theme === 'light' ? `text-${stat.color}-800` : `text-${stat.color}-300`}`}>
                  {stat.value}
                </p>
              </div>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className={`${theme === 'light' ? 'bg-yellow-50 border-yellow-200' : 'bg-yellow-900 border-yellow-700'} border rounded-lg p-4`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-semibold ${theme === 'light' ? 'text-yellow-800' : 'text-yellow-300'} flex items-center`}>
              <Bell className="h-4 w-4 mr-2" />
              Pending Invitations ({invitations.length})
            </h3>
          </div>
          <div className="space-y-2">
            {invitations.map(invite => (
              <div key={invite.id} className={`flex items-center justify-between ${currentTheme.cardBg} p-3 rounded border ${currentTheme.border}`}>
                <div>
                  <p className={`font-medium ${currentTheme.text}`}>{invite.from}</p>
                  <p className={`text-sm ${currentTheme.textSecondary}`}>{invite.group} • {invite.type}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAcceptInvitation(invite.id)}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleDeclineInvitation(invite.id)}
                    className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quickActions.map((action, index) => (
          <button 
            key={index}
            onClick={action.action}
            className={`flex items-center justify-between p-4 ${currentTheme.cardBg} border ${currentTheme.border} rounded-lg ${currentTheme.hover} transition-colors`}
          >
            <div className="flex items-center">
              {action.icon}
              <div className="text-left">
                <p className={`font-medium ${currentTheme.text}`}>{action.title}</p>
                <p className={`text-sm ${currentTheme.textSecondary}`}>{action.description}</p>
              </div>
            </div>
            <ChevronRight className={`h-5 w-5 ${currentTheme.textMuted}`} />
          </button>
        ))}
      </div>
    </div>
  );
};

export default Dashboard; 