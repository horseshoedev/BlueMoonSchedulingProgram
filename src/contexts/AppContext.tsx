import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { User, AvailabilityData, Invitation, Group, TabType } from '../types';
import { useAuth } from '../hooks/useAuth';
import { AppContextType } from './AppContextTypes';

export const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [user, setUser] = useState<User>({
    id: '',
    email: '',
    name: 'Alex Chen',
    profileIcon: '',
    preferences: {
      workingHours: { start: '9:00', end: '17:00' },
      timeZone: 'PST',
      preferredTimes: ['morning', 'afternoon'],
      eventTypes: ['work', 'social', 'personal'],
      timeFormat: '12',
      theme: 'light'
    },
    createdAt: '',
    updatedAt: ''
  });

  // Update user when auth user changes
  useEffect(() => {
    if (authUser) {
      setUser(prev => ({
        ...prev,
        id: authUser.id,
        email: authUser.email,
        name: authUser.name,
      }));
    }
  }, [authUser]);

  const [availabilityData, setAvailabilityData] = useState<AvailabilityData>({
    fullyFree: [
      { date: '2025-08-07', day: 'Thursday' },
      { date: '2025-08-09', day: 'Saturday' },
      { date: '2025-08-10', day: 'Sunday' },
      { date: '2025-08-14', day: 'Thursday' }
    ],
    partiallyFree: [
      { date: '2025-08-06', day: 'Wednesday', availableSlots: ['9:00-11:00', '14:00-17:00'] },
      { date: '2025-08-08', day: 'Friday', availableSlots: ['13:00-17:00'] },
      { date: '2025-08-12', day: 'Tuesday', availableSlots: ['9:00-12:00'] }
    ],
    recurring: [
      { pattern: 'Every Friday 15:00-17:00', type: 'work', description: 'Open office hours' },
      { pattern: 'Every Saturday morning', type: 'social', description: 'Weekend hangouts' }
    ]
  });

  const [invitations, setInvitations] = useState<Invitation[]>([
    { id: 1, from: 'Sarah Kim', group: 'Marketing Team', type: 'work', status: 'pending' },
    { id: 2, from: 'Book Club', group: 'Book Club', type: 'social', status: 'pending' }
  ]);

  const [groups, setGroups] = useState<Group[]>([
    { id: 1, name: 'Marketing Team', members: 5, type: 'work', lastActive: '2 hours ago', isJoined: true, description: 'Marketing campaigns and content creation' },
    { id: 2, name: 'Family', members: 4, type: 'personal', lastActive: '1 day ago', isJoined: true, description: 'Family events and gatherings' },
    { id: 3, name: 'Book Club', members: 8, type: 'social', lastActive: '3 days ago', isJoined: false, description: 'Monthly book discussions and reviews' },
    { id: 4, name: 'Development Squad', members: 12, type: 'work', lastActive: '30 minutes ago', isJoined: false, description: 'Software development and coding projects' },
    { id: 5, name: 'Fitness Group', members: 15, type: 'social', lastActive: '4 hours ago', isJoined: false, description: 'Workout sessions and fitness challenges' },
    { id: 6, name: 'Study Group', members: 6, type: 'personal', lastActive: '1 day ago', isJoined: true, description: 'Academic study sessions and exam prep' },
    { id: 7, name: 'Project Alpha', members: 8, type: 'work', lastActive: '6 hours ago', isJoined: false, description: 'New product development initiative' },
    { id: 8, name: 'Weekend Warriors', members: 20, type: 'social', lastActive: '2 days ago', isJoined: false, description: 'Adventure activities and outdoor events' },
    { id: 9, name: 'Design Team', members: 7, type: 'work', lastActive: '1 hour ago', isJoined: false, description: 'UI/UX design and creative projects' },
    { id: 10, name: 'Cooking Club', members: 10, type: 'social', lastActive: '5 days ago', isJoined: false, description: 'Cooking classes and recipe sharing' }
  ]);

  const joinGroup = (groupId: number) => {
    setGroups(prevGroups => 
      prevGroups.map(group => 
        group.id === groupId 
          ? { ...group, isJoined: true, members: group.members + 1 }
          : group
      )
    );
  };

  const leaveGroup = (groupId: number) => {
    setGroups(prevGroups => 
      prevGroups.map(group => 
        group.id === groupId 
          ? { ...group, isJoined: false, members: Math.max(0, group.members - 1) }
          : group
      )
    );
  };

  const value: AppContextType = {
    activeTab,
    setActiveTab,
    theme,
    setTheme,
    user,
    setUser,
    availabilityData,
    setAvailabilityData,
    invitations,
    setInvitations,
    groups,
    setGroups,
    joinGroup,
    leaveGroup
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}; 