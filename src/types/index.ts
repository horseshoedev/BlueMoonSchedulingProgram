export interface User {
  id: string;
  email: string;
  name: string;
  profileIcon?: string;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
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
  eventType?: 'work' | 'social' | 'personal';
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
  id: number | string;
  name: string;
  members: number;
  type: string;
  lastActive?: string;
  isJoined?: boolean;
  description?: string;
  role?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
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

export type TabType = 'dashboard' | 'availability' | 'groups' | 'schedule' | 'settings';

// Authentication types
export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  registerOnly: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

// Schedule types
export interface ScheduleEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  date: string;
  type: 'work' | 'personal' | 'social';
  groupId?: string;
  groupName?: string;
  attendees: string[];
  location?: string;
  isRecurring?: boolean;
  recurringPattern?: string;
  status: 'scheduled' | 'pending' | 'cancelled';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleMeetingData {
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  groupId?: string;
  attendees: string[];
  location?: string;
  isRecurring?: boolean;
  recurringPattern?: string;
}

// Calendar Integration types
export interface CalendarIntegration {
  id: string;
  userId: string;
  provider: 'google' | 'ical';
  accountEmail: string;
  isConnected: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  calendarId?: string;
  calendarName?: string;
  lastSync?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  attendees?: string[];
  source: 'google' | 'ical' | 'local';
  externalId?: string;
  calendarId?: string;
}

export interface iCalConfig {
  serverUrl: string;
  username: string;
  password: string;
  calendarName?: string;
}

export interface CalendarSyncStatus {
  isSyncing: boolean;
  lastSyncTime?: string;
  error?: string;
} 