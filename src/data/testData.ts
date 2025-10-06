import { User, Group } from '../types';

// Test User - Main user for testing interactions
export const testUser: User = {
  id: 'test-user-1',
  email: 'alex.chen@test.com',
  name: 'Alex Chen',
  profileIcon: '👨‍💼',
  preferences: {
    workingHours: { start: '9:00', end: '17:00' },
    timeZone: 'PST',
    preferredTimes: ['morning', 'afternoon'],
    eventTypes: ['work', 'social', 'personal'],
    timeFormat: '12',
    theme: 'light'
  },
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z'
};

// Test user password (for login testing)
export const testUserPassword = 'Imaging4-Taekwondo9-Charting4-Seventeen9-Securely2';

// Fake Users for testing group interactions
export const fakeUsers = [
  {
    id: 'user-2',
    email: 'sarah.kim@test.com',
    name: 'Sarah Kim',
    profileIcon: '👩‍💼',
    role: 'Team Lead'
  },
  {
    id: 'user-3',
    email: 'mike.johnson@test.com',
    name: 'Mike Johnson',
    profileIcon: '👨‍🔧',
    role: 'Developer'
  },
  {
    id: 'user-4',
    email: 'emma.davis@test.com',
    name: 'Emma Davis',
    profileIcon: '👩‍🎨',
    role: 'Designer'
  }
];

// Test Groups with detailed member information
export const testGroups: Group[] = [
  {
    id: 'group-test-1',
    name: 'Test Marketing Team',
    members: 4,
    type: 'work',
    lastActive: '2 hours ago',
    isJoined: true,
    description: 'Marketing campaigns and content creation - Test group for work interactions',
    role: 'Admin',
    createdBy: 'test-user-1',
    createdAt: '2025-01-01T10:00:00Z',
    updatedAt: '2025-10-02T08:00:00Z'
  },
  {
    id: 'group-test-2',
    name: 'Test Book Club',
    members: 5,
    type: 'social',
    lastActive: '1 day ago',
    isJoined: true,
    description: 'Monthly book discussions and reviews - Test group for social interactions',
    role: 'Member',
    createdBy: 'user-2',
    createdAt: '2025-02-15T14:00:00Z',
    updatedAt: '2025-10-01T19:00:00Z'
  },
  {
    id: 'group-test-3',
    name: 'Test Family Circle',
    members: 6,
    type: 'personal',
    lastActive: '3 hours ago',
    isJoined: false,
    description: 'Family events and gatherings - Test group for personal interactions',
    role: undefined,
    createdBy: 'user-3',
    createdAt: '2025-03-20T16:00:00Z',
    updatedAt: '2025-10-02T07:00:00Z'
  }
];

// Group member details for test groups
export const groupMembers = {
  'group-test-1': [
    { ...fakeUsers[0], role: 'Team Lead', joinedAt: '2025-01-01T10:00:00Z' },
    { ...fakeUsers[1], role: 'Developer', joinedAt: '2025-01-05T12:00:00Z' },
    { ...fakeUsers[2], role: 'Designer', joinedAt: '2025-01-10T09:00:00Z' },
    { id: testUser.id, name: testUser.name, profileIcon: testUser.profileIcon, role: 'Admin', joinedAt: '2025-01-01T10:00:00Z' }
  ],
  'group-test-2': [
    { ...fakeUsers[0], role: 'Organizer', joinedAt: '2025-02-15T14:00:00Z' },
    { ...fakeUsers[1], role: 'Member', joinedAt: '2025-02-16T18:00:00Z' },
    { ...fakeUsers[2], role: 'Member', joinedAt: '2025-02-20T20:00:00Z' },
    { id: testUser.id, name: testUser.name, profileIcon: testUser.profileIcon, role: 'Member', joinedAt: '2025-02-18T15:00:00Z' },
    { id: 'user-5', name: 'David Lee', profileIcon: '👨‍🏫', role: 'Member', joinedAt: '2025-02-25T11:00:00Z' }
  ],
  'group-test-3': [
    { ...fakeUsers[2], role: 'Admin', joinedAt: '2025-03-20T16:00:00Z' },
    { id: 'user-6', name: 'Lisa Chen', profileIcon: '👩‍👧', role: 'Member', joinedAt: '2025-03-20T16:00:00Z' },
    { id: 'user-7', name: 'Tom Chen', profileIcon: '👨‍👦', role: 'Member', joinedAt: '2025-03-20T16:00:00Z' },
    { id: 'user-8', name: 'Amy Chen', profileIcon: '👧', role: 'Member', joinedAt: '2025-03-20T16:00:00Z' },
    { id: 'user-9', name: 'Bob Chen', profileIcon: '👴', role: 'Member', joinedAt: '2025-03-20T16:00:00Z' },
    { id: 'user-10', name: 'Grace Chen', profileIcon: '👵', role: 'Member', joinedAt: '2025-03-20T16:00:00Z' }
  ]
};

// Test interactions/events for these groups
export const testInteractions = [
  {
    groupId: 'group-test-1',
    type: 'meeting',
    title: 'Weekly Marketing Sync',
    date: '2025-10-03',
    time: '10:00-11:00',
    attendees: ['test-user-1', 'user-2', 'user-3', 'user-4']
  },
  {
    groupId: 'group-test-2',
    type: 'event',
    title: 'Book Discussion: "The Great Gatsby"',
    date: '2025-10-05',
    time: '19:00-20:30',
    attendees: ['test-user-1', 'user-2', 'user-3', 'user-4', 'user-5']
  },
  {
    groupId: 'group-test-3',
    type: 'gathering',
    title: 'Family Dinner',
    date: '2025-10-06',
    time: '18:00-20:00',
    attendees: ['user-6', 'user-7', 'user-8', 'user-9', 'user-10', 'user-3']
  }
];
