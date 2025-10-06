const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { google } = require('googleapis');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth endpoints
  message: { message: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs for general endpoints
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/api/auth', authLimiter);
app.use('/api', generalLimiter);

// In-memory storage (in production, use a database)
const users = [];
const groups = [];
const groupMembers = []; // { groupId, userId, role, joinedAt }
const invitations = []; // { id, fromUserId, toUserId, groupId, status, createdAt }
const calendarIntegrations = []; // { id, userId, provider, tokens, calendarId, etc. }

// Initialize test user
(async () => {
  const testUserPassword = 'Imaging4-Taekwondo9-Charting4-Seventeen9-Securely2';
  const hashedPassword = await bcrypt.hash(testUserPassword, 10);

  const testUser = {
    id: 'test-user-1',
    email: 'alex.chen@test.com',
    name: 'Alex Chen',
    password: hashedPassword,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };

  users.push(testUser);
  console.log('Test user initialized: alex.chen@test.com');
})();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    // Verify user still exists
    const user = users.find(u => u.id === decoded.id);
    if (!user) {
      return res.status(403).json({ message: 'User not found' });
    }

    req.user = decoded;
    next();
  });
};

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        obj[key] = sanitize(obj[key]);
      }
    }
    return obj;
  };

  req.body = sanitize(req.body);
  next();
};

// Helper function to check group permissions
const checkGroupPermission = (userId, groupId, requiredRole = 'member') => {
  const membership = groupMembers.find(m => m.userId === userId && m.groupId === groupId);
  if (!membership) return false;

  const roleHierarchy = { member: 0, admin: 1, owner: 2 };
  const userRole = roleHierarchy[membership.role] || 0;
  const required = roleHierarchy[requiredRole] || 0;

  return userRole >= required;
};

// Enhanced validation middleware
const validateRegister = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const validateUserUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
];

const validatePasswordChange = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),
];

const validateGroup = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Group name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('type')
    .optional()
    .isIn(['public', 'private', 'invite-only'])
    .withMessage('Group type must be public, private, or invite-only'),
];

// Authentication Routes
app.post('/api/auth/register', sanitizeInput, validateRegister, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = {
      id: Date.now().toString(),
      email,
      name,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    users.push(user);

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data (without password) and token
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/auth/login', sanitizeInput, validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = users.find(user => user.email === email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data (without password) and token
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json({ user: userWithoutPassword });
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
  // In a real application, you might want to blacklist the token
  res.json({ message: 'Logged out successfully' });
});

// User Management Routes
app.get('/api/users/profile', authenticateToken, (req, res) => {
  try {
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { password: _, ...userProfile } = user;
    res.json({ user: userProfile });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/users/profile', authenticateToken, sanitizeInput, validateUserUpdate, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email } = req.body;
    const userId = req.user.id;

    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = users.find(u => u.email === email && u.id !== userId);
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Update user fields
    if (name) user.name = name;
    if (email) user.email = email;
    user.updatedAt = new Date().toISOString();

    const { password: _, ...updatedUser } = user;
    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/users/password', authenticateToken, sanitizeInput, validatePasswordChange, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    user.password = hashedNewPassword;
    user.updatedAt = new Date().toISOString();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/users/account', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Remove user from all groups
    const userMemberships = groupMembers.filter(m => m.userId === userId);
    for (const membership of userMemberships) {
      // If user is the only owner, transfer ownership or delete group
      const group = groups.find(g => g.id === membership.groupId);
      const groupOwners = groupMembers.filter(m => m.groupId === membership.groupId && m.role === 'owner');

      if (membership.role === 'owner' && groupOwners.length === 1) {
        // Find next admin to promote or delete group if no other members
        const groupAdmins = groupMembers.filter(m => m.groupId === membership.groupId && m.role === 'admin');
        if (groupAdmins.length > 0) {
          groupAdmins[0].role = 'owner';
        } else {
          // Delete group if no other admins
          const groupIndex = groups.findIndex(g => g.id === membership.groupId);
          if (groupIndex > -1) groups.splice(groupIndex, 1);
        }
      }
    }

    // Remove user memberships
    for (let i = groupMembers.length - 1; i >= 0; i--) {
      if (groupMembers[i].userId === userId) {
        groupMembers.splice(i, 1);
      }
    }

    // Remove user invitations
    for (let i = invitations.length - 1; i >= 0; i--) {
      if (invitations[i].fromUserId === userId || invitations[i].toUserId === userId) {
        invitations.splice(i, 1);
      }
    }

    // Remove user
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex > -1) {
      users.splice(userIndex, 1);
    }

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Group Management Routes
app.get('/api/groups', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const userGroups = groupMembers
      .filter(m => m.userId === userId)
      .map(m => {
        const group = groups.find(g => g.id === m.groupId);
        const memberCount = groupMembers.filter(mem => mem.groupId === m.groupId).length;

        return {
          ...group,
          members: memberCount,
          role: m.role,
          joinedAt: m.joinedAt
        };
      });

    res.json({ groups: userGroups });
  } catch (error) {
    console.error('Groups fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/groups', authenticateToken, sanitizeInput, validateGroup, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, description, type = 'private' } = req.body;
    const userId = req.user.id;

    const group = {
      id: Date.now().toString(),
      name,
      description: description || '',
      type,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    groups.push(group);

    // Add creator as owner
    groupMembers.push({
      groupId: group.id,
      userId,
      role: 'owner',
      joinedAt: new Date().toISOString()
    });

    res.status(201).json({
      message: 'Group created successfully',
      group: {
        ...group,
        members: 1,
        role: 'owner'
      }
    });
  } catch (error) {
    console.error('Group creation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/groups/:groupId', authenticateToken, (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const group = groups.find(g => g.id === groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is member of the group
    const membership = groupMembers.find(m => m.groupId === groupId && m.userId === userId);
    if (!membership) {
      return res.status(403).json({ message: 'Access denied. You are not a member of this group.' });
    }

    const members = groupMembers
      .filter(m => m.groupId === groupId)
      .map(m => {
        const user = users.find(u => u.id === m.userId);
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: m.role,
          joinedAt: m.joinedAt
        };
      });

    res.json({
      group: {
        ...group,
        members: members,
        memberCount: members.length,
        userRole: membership.role
      }
    });
  } catch (error) {
    console.error('Group fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/groups/:groupId', authenticateToken, sanitizeInput, validateGroup, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { groupId } = req.params;
    const { name, description, type } = req.body;
    const userId = req.user.id;

    const group = groups.find(g => g.id === groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user has admin permissions
    if (!checkGroupPermission(userId, groupId, 'admin')) {
      return res.status(403).json({ message: 'Access denied. Admin permissions required.' });
    }

    // Update group fields
    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (type) group.type = type;
    group.updatedAt = new Date().toISOString();

    res.json({
      message: 'Group updated successfully',
      group
    });
  } catch (error) {
    console.error('Group update error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/groups/:groupId', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const group = groups.find(g => g.id === groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is owner
    if (!checkGroupPermission(userId, groupId, 'owner')) {
      return res.status(403).json({ message: 'Access denied. Owner permissions required.' });
    }

    // Remove all group members
    for (let i = groupMembers.length - 1; i >= 0; i--) {
      if (groupMembers[i].groupId === groupId) {
        groupMembers.splice(i, 1);
      }
    }

    // Remove all invitations for this group
    for (let i = invitations.length - 1; i >= 0; i--) {
      if (invitations[i].groupId === groupId) {
        invitations.splice(i, 1);
      }
    }

    // Remove group
    const groupIndex = groups.findIndex(g => g.id === groupId);
    if (groupIndex > -1) {
      groups.splice(groupIndex, 1);
    }

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Group deletion error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Group membership management
app.post('/api/groups/:groupId/invite', authenticateToken, sanitizeInput, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { email } = req.body;
    const userId = req.user.id;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const group = groups.find(g => g.id === groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user has admin permissions
    if (!checkGroupPermission(userId, groupId, 'admin')) {
      return res.status(403).json({ message: 'Access denied. Admin permissions required.' });
    }

    // Find user to invite
    const inviteeUser = users.find(u => u.email === email.toLowerCase());
    if (!inviteeUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already a member
    const existingMembership = groupMembers.find(m => m.groupId === groupId && m.userId === inviteeUser.id);
    if (existingMembership) {
      return res.status(400).json({ message: 'User is already a member of this group' });
    }

    // Check if invitation already exists
    const existingInvitation = invitations.find(i =>
      i.groupId === groupId && i.toUserId === inviteeUser.id && i.status === 'pending'
    );
    if (existingInvitation) {
      return res.status(400).json({ message: 'Invitation already sent to this user' });
    }

    const invitation = {
      id: Date.now().toString(),
      fromUserId: userId,
      toUserId: inviteeUser.id,
      groupId,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    invitations.push(invitation);

    res.status(201).json({
      message: 'Invitation sent successfully',
      invitation: {
        ...invitation,
        fromUser: users.find(u => u.id === userId).name,
        toUser: inviteeUser.name,
        group: group.name
      }
    });
  } catch (error) {
    console.error('Invitation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/invitations', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;

    const userInvitations = invitations
      .filter(i => i.toUserId === userId && i.status === 'pending')
      .map(i => {
        const fromUser = users.find(u => u.id === i.fromUserId);
        const group = groups.find(g => g.id === i.groupId);

        return {
          id: i.id,
          from: fromUser.name,
          group: group.name,
          type: 'group',
          status: i.status,
          createdAt: i.createdAt
        };
      });

    res.json({ invitations: userInvitations });
  } catch (error) {
    console.error('Invitations fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/invitations/:invitationId/respond', authenticateToken, sanitizeInput, async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { action } = req.body; // 'accept' or 'decline'
    const userId = req.user.id;

    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({ message: 'Action must be either "accept" or "decline"' });
    }

    const invitation = invitations.find(i => i.id === invitationId && i.toUserId === userId);
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'Invitation has already been responded to' });
    }

    invitation.status = action === 'accept' ? 'accepted' : 'declined';

    if (action === 'accept') {
      // Add user to group as member
      groupMembers.push({
        groupId: invitation.groupId,
        userId,
        role: 'member',
        joinedAt: new Date().toISOString()
      });
    }

    res.json({
      message: `Invitation ${action}ed successfully`,
      invitation
    });
  } catch (error) {
    console.error('Invitation response error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/groups/:groupId/members/:memberId', authenticateToken, async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = req.user.id;

    const group = groups.find(g => g.id === groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const targetMembership = groupMembers.find(m => m.groupId === groupId && m.userId === memberId);
    if (!targetMembership) {
      return res.status(404).json({ message: 'Member not found in this group' });
    }

    const userMembership = groupMembers.find(m => m.groupId === groupId && m.userId === userId);
    if (!userMembership) {
      return res.status(403).json({ message: 'Access denied. You are not a member of this group.' });
    }

    // Users can remove themselves, or admins can remove members
    const canRemove = userId === memberId ||
                      (checkGroupPermission(userId, groupId, 'admin') && targetMembership.role !== 'owner');

    if (!canRemove) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    // Remove member
    const membershipIndex = groupMembers.findIndex(m => m.groupId === groupId && m.userId === memberId);
    if (membershipIndex > -1) {
      groupMembers.splice(membershipIndex, 1);
    }

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Member removal error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Google OAuth Configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events'
];

// Google Calendar Routes
app.get('/api/calendar/google/auth-url', authenticateToken, (req, res) => {
  try {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
      state: req.user.id
    });

    res.json({ authUrl });
  } catch (error) {
    console.error('Generate auth URL error:', error);
    res.status(500).json({ message: 'Failed to generate auth URL' });
  }
});

app.get('/api/calendar/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const userId = state;

    if (!code) {
      return res.status(400).json({ message: 'Authorization code is required' });
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user's calendar info
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const calendarList = await calendar.calendarList.list();
    const primaryCalendar = calendarList.data.items.find(cal => cal.primary);

    // Remove existing Google integration for this user
    const existingIndex = calendarIntegrations.findIndex(
      ci => ci.userId === userId && ci.provider === 'google'
    );
    if (existingIndex > -1) {
      calendarIntegrations.splice(existingIndex, 1);
    }

    // Create new integration
    const integration = {
      id: Date.now().toString(),
      userId,
      provider: 'google',
      accountEmail: primaryCalendar?.summary || 'Unknown',
      isConnected: true,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(tokens.expiry_date).toISOString(),
      calendarId: primaryCalendar?.id || 'primary',
      calendarName: primaryCalendar?.summary || 'Primary Calendar',
      lastSync: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    calendarIntegrations.push(integration);

    // Close the popup window with success
    res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage({ type: 'google-oauth-success' }, '*');
            window.close();
          </script>
          <p>Authorization successful! You can close this window.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage({ type: 'google-oauth-error', error: '${error.message}' }, '*');
            window.close();
          </script>
          <p>Authorization failed. Please try again.</p>
        </body>
      </html>
    `);
  }
});

app.get('/api/calendar/google/integration', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const integration = calendarIntegrations.find(
      ci => ci.userId === userId && ci.provider === 'google'
    );

    if (!integration) {
      return res.status(404).json({ message: 'Google Calendar not connected' });
    }

    // Don't send tokens to frontend
    const { accessToken, refreshToken, ...safeIntegration } = integration;
    res.json({ integration: safeIntegration });
  } catch (error) {
    console.error('Get Google integration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/calendar/google/disconnect', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const integrationIndex = calendarIntegrations.findIndex(
      ci => ci.userId === userId && ci.provider === 'google'
    );

    if (integrationIndex === -1) {
      return res.status(404).json({ message: 'Google Calendar not connected' });
    }

    calendarIntegrations.splice(integrationIndex, 1);
    res.json({ message: 'Google Calendar disconnected successfully' });
  } catch (error) {
    console.error('Google disconnect error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/calendar/google/events', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { from, to } = req.query;

    const integration = calendarIntegrations.find(
      ci => ci.userId === userId && ci.provider === 'google'
    );

    if (!integration) {
      return res.status(404).json({ message: 'Google Calendar not connected' });
    }

    // Set OAuth credentials
    oauth2Client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken,
      expiry_date: new Date(integration.expiresAt).getTime()
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const response = await calendar.events.list({
      calendarId: integration.calendarId,
      timeMin: from,
      timeMax: to,
      singleEvents: true,
      orderBy: 'startTime'
    });

    const events = response.data.items.map(event => ({
      id: event.id,
      summary: event.summary,
      description: event.description,
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      location: event.location,
      attendees: event.attendees?.map(a => a.email) || [],
      source: 'google',
      externalId: event.id,
      calendarId: integration.calendarId
    }));

    res.json({ events });
  } catch (error) {
    console.error('Fetch Google events error:', error);
    res.status(500).json({ message: 'Failed to fetch Google Calendar events' });
  }
});

app.post('/api/calendar/google/sync', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { event } = req.body;

    const integration = calendarIntegrations.find(
      ci => ci.userId === userId && ci.provider === 'google'
    );

    if (!integration) {
      return res.status(404).json({ message: 'Google Calendar not connected' });
    }

    // Set OAuth credentials
    oauth2Client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken,
      expiry_date: new Date(integration.expiresAt).getTime()
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const googleEvent = {
      summary: event.title,
      description: event.description,
      location: event.location,
      start: {
        dateTime: `${event.date}T${event.startTime}:00`,
        timeZone: 'America/Los_Angeles'
      },
      end: {
        dateTime: `${event.date}T${event.endTime}:00`,
        timeZone: 'America/Los_Angeles'
      },
      attendees: event.attendees?.map(email => ({ email })) || []
    };

    const response = await calendar.events.insert({
      calendarId: integration.calendarId,
      resource: googleEvent
    });

    res.json({
      message: 'Event synced to Google Calendar',
      eventId: response.data.id
    });
  } catch (error) {
    console.error('Sync to Google Calendar error:', error);
    res.status(500).json({ message: 'Failed to sync event to Google Calendar' });
  }
});

// Get all calendar integrations
app.get('/api/calendar/integrations', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const userIntegrations = calendarIntegrations
      .filter(ci => ci.userId === userId)
      .map(({ accessToken, refreshToken, ...integration }) => integration);

    res.json({ integrations: userIntegrations });
  } catch (error) {
    console.error('Get integrations error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// iCal/CalDAV Routes
app.post('/api/calendar/ical/connect', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { serverUrl, username, password, calendarName } = req.body;

    if (!serverUrl || !username || !password) {
      return res.status(400).json({ message: 'Server URL, username, and password are required' });
    }

    // Test CalDAV connection
    try {
      const response = await axios({
        method: 'PROPFIND',
        url: serverUrl,
        auth: { username, password },
        headers: {
          'Content-Type': 'application/xml',
          'Depth': '1'
        }
      });

      if (response.status !== 207) {
        throw new Error('CalDAV connection test failed');
      }
    } catch (error) {
      return res.status(400).json({
        message: 'Failed to connect to CalDAV server. Please check your credentials.'
      });
    }

    // Remove existing iCal integration for this user
    const existingIndex = calendarIntegrations.findIndex(
      ci => ci.userId === userId && ci.provider === 'ical'
    );
    if (existingIndex > -1) {
      calendarIntegrations.splice(existingIndex, 1);
    }

    // Create new integration (store credentials encrypted in production!)
    const integration = {
      id: Date.now().toString(),
      userId,
      provider: 'ical',
      accountEmail: username,
      isConnected: true,
      accessToken: Buffer.from(`${username}:${password}`).toString('base64'), // Basic auth encoded
      calendarId: serverUrl,
      calendarName: calendarName || 'iCal Calendar',
      lastSync: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    calendarIntegrations.push(integration);

    const { accessToken, ...safeIntegration } = integration;
    res.json({
      message: 'iCal calendar connected successfully',
      integration: safeIntegration
    });
  } catch (error) {
    console.error('iCal connect error:', error);
    res.status(500).json({ message: 'Failed to connect to iCal calendar' });
  }
});

app.get('/api/calendar/ical/integration', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const integration = calendarIntegrations.find(
      ci => ci.userId === userId && ci.provider === 'ical'
    );

    if (!integration) {
      return res.status(404).json({ message: 'iCal calendar not connected' });
    }

    const { accessToken, ...safeIntegration } = integration;
    res.json({ integration: safeIntegration });
  } catch (error) {
    console.error('Get iCal integration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/calendar/ical/disconnect', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const integrationIndex = calendarIntegrations.findIndex(
      ci => ci.userId === userId && ci.provider === 'ical'
    );

    if (integrationIndex === -1) {
      return res.status(404).json({ message: 'iCal calendar not connected' });
    }

    calendarIntegrations.splice(integrationIndex, 1);
    res.json({ message: 'iCal calendar disconnected successfully' });
  } catch (error) {
    console.error('iCal disconnect error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/calendar/ical/events', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { from, to } = req.query;

    const integration = calendarIntegrations.find(
      ci => ci.userId === userId && ci.provider === 'ical'
    );

    if (!integration) {
      return res.status(404).json({ message: 'iCal calendar not connected' });
    }

    // Decode basic auth credentials
    const credentials = Buffer.from(integration.accessToken, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    // Fetch calendar data via CalDAV
    const response = await axios({
      method: 'REPORT',
      url: integration.calendarId,
      auth: { username, password },
      headers: {
        'Content-Type': 'application/xml',
        'Depth': '1'
      },
      data: `<?xml version="1.0" encoding="utf-8" ?>
        <C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
          <D:prop>
            <D:getetag/>
            <C:calendar-data/>
          </D:prop>
          <C:filter>
            <C:comp-filter name="VCALENDAR">
              <C:comp-filter name="VEVENT">
                <C:time-range start="${new Date(from).toISOString().replace(/[-:]/g, '').split('.')[0]}Z"
                              end="${new Date(to).toISOString().replace(/[-:]/g, '').split('.')[0]}Z"/>
              </C:comp-filter>
            </C:comp-filter>
          </C:filter>
        </C:calendar-query>`
    });

    // Parse iCal data (simplified - in production use ical.js library properly)
    const events = [];
    // Note: This is a simplified placeholder. Full implementation would use ical.js
    // to properly parse the VCALENDAR data from the response

    res.json({ events });
  } catch (error) {
    console.error('Fetch iCal events error:', error);
    res.status(500).json({ message: 'Failed to fetch iCal events' });
  }
});

app.post('/api/calendar/ical/sync', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { event } = req.body;

    const integration = calendarIntegrations.find(
      ci => ci.userId === userId && ci.provider === 'ical'
    );

    if (!integration) {
      return res.status(404).json({ message: 'iCal calendar not connected' });
    }

    // Decode basic auth credentials
    const credentials = Buffer.from(integration.accessToken, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    // Create iCal format event
    const icalEvent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Blue Moon Scheduler//EN
BEGIN:VEVENT
UID:${Date.now()}@bluemoon
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${event.date.replace(/-/g, '')}T${event.startTime.replace(/:/g, '')}00Z
DTEND:${event.date.replace(/-/g, '')}T${event.endTime.replace(/:/g, '')}00Z
SUMMARY:${event.title}
DESCRIPTION:${event.description || ''}
LOCATION:${event.location || ''}
END:VEVENT
END:VCALENDAR`;

    // Send to CalDAV server
    await axios({
      method: 'PUT',
      url: `${integration.calendarId}/${Date.now()}.ics`,
      auth: { username, password },
      headers: {
        'Content-Type': 'text/calendar',
      },
      data: icalEvent
    });

    res.json({ message: 'Event synced to iCal calendar' });
  } catch (error) {
    console.error('Sync to iCal error:', error);
    res.status(500).json({ message: 'Failed to sync event to iCal calendar' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
