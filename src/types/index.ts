export interface User {
  name: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  workingHours: {
    start: string;
    end: string;
  };
  timeZone: string;
  preferredTimes: string[];
  eventTypes: string[];
  timeFormat: '12' | '24';
  theme: 'light' | 'dark';
}

export interface AvailabilityDay {
  date: string;
  day: string;
  availableSlots?: string[];
}

export interface RecurringPattern {
  pattern: string;
  type: string;
  description: string;
}

export interface AvailabilityData {
  fullyFree: AvailabilityDay[];
  partiallyFree: AvailabilityDay[];
  recurring: RecurringPattern[];
}

export interface Invitation {
  id: number;
  from: string;
  group: string;
  type: string;
  status: string;
}

export interface Group {
  id: number;
  name: string;
  members: number;
  type: string;
  lastActive: string;
}

export interface ThemeClasses {
  bg: string;
  cardBg: string;
  headerBg: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  hover: string;
  sidebar: string;
  input: string;
}

export type TabType = 'dashboard' | 'availability' | 'groups' | 'settings'; 