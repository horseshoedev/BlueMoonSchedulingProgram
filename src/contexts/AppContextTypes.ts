import { User, AvailabilityData, Invitation, Group, TabType } from '../types';

export interface AppContextType {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  user: User;
  setUser: (user: User) => void;
  availabilityData: AvailabilityData;
  setAvailabilityData: (data: AvailabilityData) => void;
  invitations: Invitation[];
  setInvitations: (invitations: Invitation[]) => void;
  groups: Group[];
  setGroups: (groups: Group[]) => void;
  addGroup: (group: Group) => void;
  joinGroup: (groupId: number | string) => void;
  leaveGroup: (groupId: number | string) => void;
} 