import React, { createContext, useState, ReactNode } from 'react';
import { User, AvailabilityData, Invitation, Group, TabType } from '../types';
import { AppContextType } from './AppContextTypes';

export const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [user, setUser] = useState<User>({
    name: 'Alex Chen',
    preferences: {
      workingHours: { start: '9:00', end: '17:00' },
      timeZone: 'PST',
      preferredTimes: ['morning', 'afternoon'],
      eventTypes: ['work', 'social', 'personal'],
      timeFormat: '12',
      theme: 'light'
    }
  });

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
    { id: 1, name: 'Marketing Team', members: 5, type: 'work', lastActive: '2 hours ago' },
    { id: 2, name: 'Family', members: 4, type: 'personal', lastActive: '1 day ago' },
    { id: 3, name: 'Book Club', members: 8, type: 'social', lastActive: '3 days ago' }
  ]);

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
    setGroups
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}; 