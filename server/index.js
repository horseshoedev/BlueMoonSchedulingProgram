const express = require('express');
const cors = require('cors');
const compression = require('compression');
const expressStaticGzip = require('express-static-gzip');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { google } = require('googleapis');
const axios = require('axios');
const { sendProposalEmail, sendResponseConfirmation, generateResponseToken } = require('./services/emailService');
require('dotenv').config();

// Import database and repositories
const db = require('./db');
const userRepo = require('./repositories/userRepository');
const groupRepo = require('./repositories/groupRepository');
const invitationRepo = require('./repositories/invitationRepository');
const calendarRepo = require('./repositories/calendarIntegrationRepository');
const meetingRepo = require('./repositories/meetingProposalRepository');
const scheduleRepo = require('./repositories/scheduleEventRepository');
const availabilityRepo = require('./repositories/availabilityRepository');

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
// Enable gzip/brotli compression for all responses
app.use(compression({
  // Compression level (0-9, 6 is default, 9 is max)
  level: 6,
  // Only compress responses larger than this (in bytes)
  threshold: 1024,
  // Filter function to determine what to compress
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Compress all text-based responses
    return compression.filter(req, res);
  }
}));

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/api/auth', authLimiter);
app.use('/api', generalLimiter);

// Database is now used for all data storage
// See server/db/seed.js for test data initialization

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    try {
      // Verify user still exists in database
      const user = await userRepo.findById(decoded.id);
      if (!user) {
        return res.status(403).json({ message: 'User not found' });
      }

      req.user = decoded;
      next();
    } catch (error) {
      console.error('Auth token verification error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
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
const checkGroupPermission = async (userId, groupId, requiredRole = 'member') => {
  try {
    const role = await groupRepo.getMemberRole(groupId, userId);
    if (!role) return false;

    const roleHierarchy = { member: 0, admin: 1, owner: 2 };
    const userRole = roleHierarchy[role] || 0;
    const required = roleHierarchy[requiredRole] || 0;

    return userRole >= required;
  } catch (error) {
    console.error('Check group permission error:', error);
    return false;
  }
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
    const emailExists = await userRepo.emailExists(email);
    if (emailExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await userRepo.createUser({
      email,
      password: hashedPassword,
      name,
      preferences: {
        workingHours: { start: '09:00', end: '17:00' },
        timeZone: 'UTC',
        preferredTimes: [],
        eventTypes: [],
        timeFormat: '12',
        theme: 'light',
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data and token
    res.status(201).json({
      user,
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

    // Find user (with password for verification)
    const user = await userRepo.findByEmail(email, true);
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

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await userRepo.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
  // In a real application, you might want to blacklist the token
  res.json({ message: 'Logged out successfully' });
});

// User Management Routes
app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const user = await userRepo.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
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

    const { name, email, preferences } = req.body;
    const userId = req.user.id;

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await userRepo.findByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Build updates object
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (preferences) updates.preferences = preferences;

    // Update user
    const updatedUser = await userRepo.updateProfile(userId, updates);

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

    // Find user with password
    const user = await userRepo.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user with password for verification
    const userWithPassword = await userRepo.findByEmail(user.email, true);

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userWithPassword.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await userRepo.updatePassword(userId, hashedNewPassword);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/users/account', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Soft delete user (database cascades will handle related data)
    const success = await userRepo.softDeleteUser(userId);

    if (!success) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Group Management Routes
app.get('/api/groups', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userGroups = await groupRepo.getGroupsByUserId(userId);

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

    // Create group with owner
    const group = await groupRepo.createGroup({
      name,
      description: description || '',
      type,
    }, userId);

    res.status(201).json({
      message: 'Group created successfully',
      group: {
        ...group,
        memberCount: 1,
        role: 'owner'
      }
    });
  } catch (error) {
    console.error('Group creation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/groups/:groupId', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const group = await groupRepo.getGroupById(groupId, userId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is member of the group
    if (!group.isMember) {
      return res.status(403).json({ message: 'Access denied. You are not a member of this group.' });
    }

    res.json({ group });
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

    // Check if user has admin permissions
    const hasPermission = await checkGroupPermission(userId, groupId, 'admin');
    if (!hasPermission) {
      return res.status(403).json({ message: 'Access denied. Admin permissions required.' });
    }

    // Build updates object
    const updates = {};
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (type) updates.type = type;

    // Update group
    const group = await groupRepo.updateGroup(groupId, updates);

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

    // Check if user is owner
    const hasPermission = await checkGroupPermission(userId, groupId, 'owner');
    if (!hasPermission) {
      return res.status(403).json({ message: 'Access denied. Owner permissions required.' });
    }

    // Soft delete group (database cascades will handle related data)
    const success = await groupRepo.softDeleteGroup(groupId);

    if (!success) {
      return res.status(404).json({ message: 'Group not found' });
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

    // Check if user has admin permissions
    const hasPermission = await checkGroupPermission(userId, groupId, 'admin');
    if (!hasPermission) {
      return res.status(403).json({ message: 'Access denied. Admin permissions required.' });
    }

    // Find user to invite
    const inviteeUser = await userRepo.findByEmail(email.toLowerCase());
    if (!inviteeUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already a member
    const isMember = await groupRepo.isMember(groupId, inviteeUser.id);
    if (isMember) {
      return res.status(400).json({ message: 'User is already a member of this group' });
    }

    // Check if invitation already exists
    const exists = await invitationRepo.invitationExists(groupId, inviteeUser.id, 'pending');
    if (exists) {
      return res.status(400).json({ message: 'Invitation already sent to this user' });
    }

    // Create invitation
    const invitation = await invitationRepo.createInvitation({
      fromUserId: userId,
      toUserId: inviteeUser.id,
      groupId,
    });

    // Get additional details for response
    const group = await groupRepo.getGroupById(groupId);
    const fromUser = await userRepo.findById(userId);

    res.status(201).json({
      message: 'Invitation sent successfully',
      invitation: {
        ...invitation,
        fromUserName: fromUser.name,
        toUserName: inviteeUser.name,
        groupName: group.name
      }
    });
  } catch (error) {
    console.error('Invitation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/invitations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const userInvitations = await invitationRepo.getInvitationsByUserId(userId, 'pending');

    // Format response to match expected structure
    const formattedInvitations = userInvitations.map(i => ({
      id: i.id,
      from: i.fromUserName,
      group: i.groupName,
      type: 'group',
      status: i.status,
      createdAt: i.createdAt
    }));

    res.json({ invitations: formattedInvitations });
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

    const invitation = await invitationRepo.getInvitationById(invitationId);
    if (!invitation || invitation.toUserId !== userId) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'Invitation has already been responded to' });
    }

    // Update invitation status
    const newStatus = action === 'accept' ? 'accepted' : 'declined';
    const updatedInvitation = await invitationRepo.updateInvitationStatus(invitationId, newStatus);

    if (action === 'accept') {
      // Add user to group as member
      await groupRepo.addMember(invitation.groupId, userId, 'member');
    }

    res.json({
      message: `Invitation ${action}ed successfully`,
      invitation: updatedInvitation
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

    // Check if user is member
    const isMember = await groupRepo.isMember(groupId, userId);
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied. You are not a member of this group.' });
    }

    // Check if target user is member
    const targetRole = await groupRepo.getMemberRole(groupId, memberId);
    if (!targetRole) {
      return res.status(404).json({ message: 'Member not found in this group' });
    }

    // Users can remove themselves, or admins can remove non-owners
    const canRemove = userId === memberId ||
                      (await checkGroupPermission(userId, groupId, 'admin') && targetRole !== 'owner');

    if (!canRemove) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    // Remove member
    await groupRepo.removeMember(groupId, memberId);

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

    // Check if user already has a Google integration
    const existing = await calendarRepo.getIntegrationByProvider(userId, 'google', primaryCalendar?.summary || 'Unknown');

    if (existing) {
      // Update existing integration
      await calendarRepo.updateTokens(existing.id, {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(tokens.expiry_date).toISOString(),
      });
    } else {
      // Create new integration
      await calendarRepo.createIntegration({
        userId,
        provider: 'google',
        accountEmail: primaryCalendar?.summary || 'Unknown',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(tokens.expiry_date).toISOString(),
        calendarId: primaryCalendar?.id || 'primary',
        calendarName: primaryCalendar?.summary || 'Primary Calendar',
      });
    }

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

app.get('/api/calendar/google/integration', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const integrations = await calendarRepo.getIntegrationsByUserId(userId, false);
    const googleIntegration = integrations.find(i => i.provider === 'google');

    if (!googleIntegration) {
      return res.status(404).json({ message: 'Google Calendar not connected' });
    }

    res.json({ integration: googleIntegration });
  } catch (error) {
    console.error('Get Google integration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/calendar/google/disconnect', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const integrations = await calendarRepo.getIntegrationsByUserId(userId, false);
    const googleIntegration = integrations.find(i => i.provider === 'google');

    if (!googleIntegration) {
      return res.status(404).json({ message: 'Google Calendar not connected' });
    }

    await calendarRepo.deleteIntegration(googleIntegration.id);
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

    const integrations = await calendarRepo.getIntegrationsByUserId(userId, true);
    const integration = integrations.find(i => i.provider === 'google');

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

    const integrations = await calendarRepo.getIntegrationsByUserId(userId, true);
    const integration = integrations.find(i => i.provider === 'google');

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
app.get('/api/calendar/integrations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userIntegrations = await calendarRepo.getIntegrationsByUserId(userId, false);

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

    // Check if user already has an iCal integration
    const existing = await calendarRepo.getIntegrationByProvider(userId, 'ical', username);

    const basicAuthToken = Buffer.from(`${username}:${password}`).toString('base64');

    if (existing) {
      // Update existing integration
      await calendarRepo.updateTokens(existing.id, {
        accessToken: basicAuthToken,
        refreshToken: null,
        expiresAt: null,
      });
    } else {
      // Create new integration
      await calendarRepo.createIntegration({
        userId,
        provider: 'ical',
        accountEmail: username,
        accessToken: basicAuthToken, // Basic auth encoded
        refreshToken: null,
        expiresAt: null,
        calendarId: serverUrl,
        calendarName: calendarName || 'iCal Calendar',
      });
    }

    res.json({
      message: 'iCal calendar connected successfully'
    });
  } catch (error) {
    console.error('iCal connect error:', error);
    res.status(500).json({ message: 'Failed to connect to iCal calendar' });
  }
});

app.get('/api/calendar/ical/integration', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const integrations = await calendarRepo.getIntegrationsByUserId(userId, false);
    const icalIntegration = integrations.find(i => i.provider === 'ical');

    if (!icalIntegration) {
      return res.status(404).json({ message: 'iCal calendar not connected' });
    }

    res.json({ integration: icalIntegration });
  } catch (error) {
    console.error('Get iCal integration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/calendar/ical/disconnect', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const integrations = await calendarRepo.getIntegrationsByUserId(userId, false);
    const icalIntegration = integrations.find(i => i.provider === 'ical');

    if (!icalIntegration) {
      return res.status(404).json({ message: 'iCal calendar not connected' });
    }

    await calendarRepo.deleteIntegration(icalIntegration.id);
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

    const integrations = await calendarRepo.getIntegrationsByUserId(userId, true);
    const icalIntegration = integrations.find(i => i.provider === 'ical');

    if (!icalIntegration) {
      return res.status(404).json({ message: 'iCal calendar not connected' });
    }

    // Decode basic auth credentials
    const credentials = Buffer.from(icalIntegration.access_token, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    // Fetch calendar data via CalDAV
    const response = await axios({
      method: 'REPORT',
      url: icalIntegration.calendar_id,
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

    const integrations = await calendarRepo.getIntegrationsByUserId(userId, true);
    const icalIntegration = integrations.find(i => i.provider === 'ical');

    if (!icalIntegration) {
      return res.status(404).json({ message: 'iCal calendar not connected' });
    }

    // Decode basic auth credentials
    const credentials = Buffer.from(icalIntegration.access_token, 'base64').toString('utf-8');
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
      url: `${icalIntegration.calendar_id}/${Date.now()}.ics`,
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

// ============================================================================
// Meeting Proposals API
// ============================================================================

// Create and send meeting proposal
app.post(
  '/api/meetings/propose',
  authenticateToken,
  sanitizeInput,
  [
    body('groupId').notEmpty().withMessage('Group ID is required'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('proposedDate').isISO8601().withMessage('Valid date is required'),
    body('proposedTime').notEmpty().withMessage('Time is required'),
    body('groupName').notEmpty().withMessage('Group name is required'),
    body('memberEmails').isArray({ min: 1 }).withMessage('At least one member email required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { groupId, title, description, proposedDate, proposedTime, groupName, memberEmails } = req.body;
      const user = await userRepo.findById(req.user.id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Create proposal
      const proposal = await meetingRepo.createProposal({
        groupId,
        proposedBy: user.id,
        proposedByName: user.name,
        title,
        description: description || '',
        proposedDate,
        proposedTime,
        groupName,
        status: 'pending'
      });

      // Generate tokens and send emails to all members
      const emailPromises = memberEmails.map(async (memberEmail) => {
        const token = generateResponseToken();
        const memberUser = await userRepo.findByEmail(memberEmail);

        // Add response placeholder
        await meetingRepo.createResponse({
          proposalId: proposal.id,
          userId: memberUser?.id || null,
          userName: memberUser?.name || memberEmail,
          userEmail: memberEmail,
          response: 'pending',
          token
        });

        // Send email
        try {
          await sendProposalEmail(
            memberEmail,
            memberUser?.name || memberEmail,
            proposal,
            token
          );
        } catch (emailError) {
          console.error(`Failed to send to ${memberEmail}:`, emailError);
        }
      });

      await Promise.all(emailPromises);

      // Get complete proposal with responses
      const completeProposal = await meetingRepo.getProposalById(proposal.id);

      res.status(201).json({
        message: 'Meeting proposal created and emails sent',
        proposal: {
          ...completeProposal,
          responses: completeProposal.responses.map(r => ({
            ...r,
            token: undefined // Don't expose tokens in response
          }))
        }
      });
    } catch (error) {
      console.error('Proposal creation error:', error);
      res.status(500).json({ message: 'Failed to create proposal' });
    }
  }
);

// Get proposals for a group
app.get('/api/meetings/proposals/:groupId', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const proposals = await meetingRepo.getProposalsByGroupId(groupId);

    // Remove tokens from responses
    const sanitizedProposals = proposals.map(p => ({
      ...p,
      responses: p.responses.map(r => ({
        userId: r.user_id,
        userName: r.user_name,
        userEmail: r.user_email,
        response: r.response,
        alternateDate: r.alternate_date,
        alternateTime: r.alternate_time,
        respondedAt: r.responded_at
      }))
    }));

    res.json({ proposals: sanitizedProposals });
  } catch (error) {
    console.error('Get proposals error:', error);
    res.status(500).json({ message: 'Failed to get proposals' });
  }
});

// Handle Yes/No response (public endpoint, uses token)
app.get('/api/meetings/respond', async (req, res) => {
  try {
    const { token, response } = req.query;

    if (!token || !response) {
      return res.status(400).send('<h1>Invalid request</h1><p>Missing token or response.</p>');
    }

    if (!['yes', 'no'].includes(response)) {
      return res.status(400).send('<h1>Invalid response</h1><p>Response must be "yes" or "no".</p>');
    }

    // Find proposal response with this token
    const foundResponse = await meetingRepo.getResponseByToken(token);

    if (!foundResponse) {
      return res.status(404).send('<h1>Proposal not found</h1><p>This link may have expired or is invalid.</p>');
    }

    // Get the complete proposal
    const foundProposal = await meetingRepo.getProposalById(foundResponse.proposal_id);

    if (!foundProposal) {
      return res.status(404).send('<h1>Proposal not found</h1><p>This link may have expired or is invalid.</p>');
    }

    // Update response
    await meetingRepo.updateResponse(foundResponse.id, {
      response,
      respondedAt: new Date().toISOString()
    });

    // Send confirmation email
    try {
      await sendResponseConfirmation(
        foundResponse.user_email,
        foundResponse.user_name,
        foundProposal,
        response
      );
    } catch (emailError) {
      console.error('Failed to send confirmation:', emailError);
    }

    // Send success HTML response
    const responseText = response === 'yes' ? '✅ You accepted the invitation!' : '❌ You declined the invitation.';
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Response Recorded</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f4f4f4; }
          .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          h1 { color: #333; }
          p { color: #666; line-height: 1.6; }
          .emoji { font-size: 48px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="emoji">${response === 'yes' ? '✅' : '❌'}</div>
          <h1>Response Recorded!</h1>
          <p>${responseText}</p>
          <p><strong>Meeting:</strong> ${foundProposal.title}</p>
          <p><strong>Date:</strong> ${new Date(foundProposal.proposed_date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${foundProposal.proposed_time}</p>
          <p style="margin-top: 30px; color: #999; font-size: 14px;">The organizer has been notified of your response.</p>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Response handling error:', error);
    res.status(500).send('<h1>Error</h1><p>Something went wrong. Please try again.</p>');
  }
});

// Handle alternate time proposal (receives POST with alternate date/time)
app.post('/api/meetings/propose-alternate', async (req, res) => {
  try {
    const { token, alternateDate, alternateTime, message } = req.body;

    if (!token || !alternateDate || !alternateTime) {
      return res.status(400).json({ message: 'Token, alternate date, and time are required' });
    }

    // Find proposal response with this token
    const foundResponse = await meetingRepo.getResponseByToken(token);

    if (!foundResponse) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    // Get the complete proposal
    const foundProposal = await meetingRepo.getProposalById(foundResponse.proposal_id);

    if (!foundProposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    // Update response with alternate suggestion
    await meetingRepo.updateResponse(foundResponse.id, {
      response: 'alternate',
      alternateDate,
      alternateTime,
      alternateMessage: message || '',
      respondedAt: new Date().toISOString()
    });

    // Send confirmation email
    try {
      await sendResponseConfirmation(
        foundResponse.user_email,
        foundResponse.user_name,
        foundProposal,
        'alternate'
      );
    } catch (emailError) {
      console.error('Failed to send confirmation:', emailError);
    }

    res.json({
      message: 'Alternate time proposal recorded',
      proposal: {
        id: foundProposal.id,
        title: foundProposal.title
      }
    });
  } catch (error) {
    console.error('Alternate proposal error:', error);
    res.status(500).json({ message: 'Failed to record alternate proposal' });
  }
});

// Get proposal by token (for response page)
app.get('/api/meetings/proposal-by-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Find proposal response with this token
    const responseEntry = await meetingRepo.getResponseByToken(token);

    if (!responseEntry) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    // Get the complete proposal
    const proposal = await meetingRepo.getProposalById(responseEntry.proposal_id);

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    res.json({
      proposal: {
        id: proposal.id,
        title: proposal.title,
        description: proposal.description,
        proposedDate: proposal.proposed_date,
        proposedTime: proposal.proposed_time,
        groupName: proposal.group_name,
        proposedByName: proposal.proposed_by_name
      },
      userResponse: {
        userName: responseEntry.user_name,
        currentResponse: responseEntry.response
      }
    });
  } catch (error) {
    console.error('Get proposal by token error:', error);
    res.status(500).json({ message: 'Failed to get proposal' });
  }
});

// Get responses for a specific proposal
app.get('/api/meetings/proposals/:id/responses', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const proposal = await meetingRepo.getProposalById(id);

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    // Check if user is the proposer or a group member
    if (proposal.proposed_by !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view responses' });
    }

    // Return responses without tokens
    const sanitizedResponses = proposal.responses.map(r => ({
      userId: r.user_id,
      userName: r.user_name,
      userEmail: r.user_email,
      response: r.response,
      alternateDate: r.alternate_date,
      alternateTime: r.alternate_time,
      alternateMessage: r.alternate_message,
      respondedAt: r.responded_at
    }));

    res.json({ responses: sanitizedResponses });
  } catch (error) {
    console.error('Get responses error:', error);
    res.status(500).json({ message: 'Failed to get responses' });
  }
});

// ============================================================================
// Schedule Events API (NEW)
// ============================================================================

// Get all events for authenticated user
app.get('/api/schedule-events', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    let events;
    if (startDate && endDate) {
      events = await scheduleRepo.getEventsByUserIdAndDateRange(userId, startDate, endDate);
    } else {
      events = await scheduleRepo.getEventsByUserId(userId);
    }

    res.json({ events });
  } catch (error) {
    console.error('Get schedule events error:', error);
    res.status(500).json({ message: 'Failed to get schedule events' });
  }
});

// Create a new schedule event
app.post('/api/schedule-events', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      title,
      description,
      startTime,
      endTime,
      location,
      eventType,
      groupId,
      attendeeIds,
      isRecurring,
      recurrencePattern
    } = req.body;

    if (!title || !startTime || !endTime) {
      return res.status(400).json({ message: 'Title, start time, and end time are required' });
    }

    const event = await scheduleRepo.createEvent({
      createdBy: userId,
      title,
      description: description || '',
      startTime,
      endTime,
      location: location || '',
      eventType: eventType || 'other',
      groupId: groupId || null,
      isRecurring: isRecurring || false,
      recurrencePattern: recurrencePattern || null
    });

    // Add attendees if provided
    if (attendeeIds && Array.isArray(attendeeIds) && attendeeIds.length > 0) {
      await scheduleRepo.addAttendees(event.id, attendeeIds);
    }

    // Get complete event with attendees
    const completeEvent = await scheduleRepo.getEventById(event.id);

    res.status(201).json({ event: completeEvent });
  } catch (error) {
    console.error('Create schedule event error:', error);
    res.status(500).json({ message: 'Failed to create schedule event' });
  }
});

// Get a specific schedule event
app.get('/api/schedule-events/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const event = await scheduleRepo.getEventById(id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user has access (creator or attendee)
    const hasAccess = event.created_by === userId ||
                      event.attendees?.some(a => a.user_id === userId);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to view this event' });
    }

    res.json({ event });
  } catch (error) {
    console.error('Get schedule event error:', error);
    res.status(500).json({ message: 'Failed to get schedule event' });
  }
});

// Update a schedule event
app.put('/api/schedule-events/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const event = await scheduleRepo.getEventById(id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Only creator can update
    if (event.created_by !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this event' });
    }

    const {
      title,
      description,
      startTime,
      endTime,
      location,
      eventType,
      attendeeIds
    } = req.body;

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (startTime !== undefined) updates.startTime = startTime;
    if (endTime !== undefined) updates.endTime = endTime;
    if (location !== undefined) updates.location = location;
    if (eventType !== undefined) updates.eventType = eventType;

    await scheduleRepo.updateEvent(id, updates);

    // Update attendees if provided
    if (attendeeIds && Array.isArray(attendeeIds)) {
      await scheduleRepo.removeAllAttendees(id);
      if (attendeeIds.length > 0) {
        await scheduleRepo.addAttendees(id, attendeeIds);
      }
    }

    // Get updated event
    const updatedEvent = await scheduleRepo.getEventById(id);

    res.json({ event: updatedEvent });
  } catch (error) {
    console.error('Update schedule event error:', error);
    res.status(500).json({ message: 'Failed to update schedule event' });
  }
});

// Delete a schedule event
app.delete('/api/schedule-events/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const event = await scheduleRepo.getEventById(id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Only creator can delete
    if (event.created_by !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }

    await scheduleRepo.deleteEvent(id);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete schedule event error:', error);
    res.status(500).json({ message: 'Failed to delete schedule event' });
  }
});

// ============================================================================
// Availability Data API (NEW)
// ============================================================================

// Get availability blocks for authenticated user
app.get('/api/availability', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    let blocks;
    if (startDate && endDate) {
      blocks = await availabilityRepo.getAvailabilityByUserIdAndDateRange(userId, startDate, endDate);
    } else {
      blocks = await availabilityRepo.getAvailabilityByUserId(userId);
    }

    res.json({ availability: blocks });
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ message: 'Failed to get availability' });
  }
});

// Create a new availability block
app.post('/api/availability', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      dayOfWeek,
      startTime,
      endTime,
      startDate,
      endDate,
      isRecurring,
      recurrencePattern
    } = req.body;

    if (!startTime || !endTime) {
      return res.status(400).json({ message: 'Start time and end time are required' });
    }

    if (isRecurring && dayOfWeek === undefined) {
      return res.status(400).json({ message: 'Day of week is required for recurring availability' });
    }

    if (!isRecurring && (!startDate || !endDate)) {
      return res.status(400).json({ message: 'Start date and end date are required for non-recurring availability' });
    }

    const block = await availabilityRepo.createAvailability({
      userId,
      dayOfWeek: dayOfWeek !== undefined ? dayOfWeek : null,
      startTime,
      endTime,
      startDate: startDate || null,
      endDate: endDate || null,
      isRecurring: isRecurring || false,
      recurrencePattern: recurrencePattern || null
    });

    res.status(201).json({ availability: block });
  } catch (error) {
    console.error('Create availability error:', error);
    res.status(500).json({ message: 'Failed to create availability' });
  }
});

// Get a specific availability block
app.get('/api/availability/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const block = await availabilityRepo.getAvailabilityById(id);

    if (!block) {
      return res.status(404).json({ message: 'Availability block not found' });
    }

    // Only the owner can view
    if (block.user_id !== userId) {
      return res.status(403).json({ message: 'Not authorized to view this availability block' });
    }

    res.json({ availability: block });
  } catch (error) {
    console.error('Get availability block error:', error);
    res.status(500).json({ message: 'Failed to get availability block' });
  }
});

// Update an availability block
app.put('/api/availability/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const block = await availabilityRepo.getAvailabilityById(id);

    if (!block) {
      return res.status(404).json({ message: 'Availability block not found' });
    }

    // Only the owner can update
    if (block.user_id !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this availability block' });
    }

    const {
      dayOfWeek,
      startTime,
      endTime,
      startDate,
      endDate,
      isRecurring,
      recurrencePattern
    } = req.body;

    const updates = {};
    if (dayOfWeek !== undefined) updates.dayOfWeek = dayOfWeek;
    if (startTime !== undefined) updates.startTime = startTime;
    if (endTime !== undefined) updates.endTime = endTime;
    if (startDate !== undefined) updates.startDate = startDate;
    if (endDate !== undefined) updates.endDate = endDate;
    if (isRecurring !== undefined) updates.isRecurring = isRecurring;
    if (recurrencePattern !== undefined) updates.recurrencePattern = recurrencePattern;

    await availabilityRepo.updateAvailability(id, updates);

    // Get updated block
    const updatedBlock = await availabilityRepo.getAvailabilityById(id);

    res.json({ availability: updatedBlock });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ message: 'Failed to update availability' });
  }
});

// Delete an availability block
app.delete('/api/availability/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const block = await availabilityRepo.getAvailabilityById(id);

    if (!block) {
      return res.status(404).json({ message: 'Availability block not found' });
    }

    // Only the owner can delete
    if (block.user_id !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this availability block' });
    }

    await availabilityRepo.deleteAvailability(id);

    res.json({ message: 'Availability block deleted successfully' });
  } catch (error) {
    console.error('Delete availability error:', error);
    res.status(500).json({ message: 'Failed to delete availability block' });
  }
});

// Serve pre-compressed static files from the dist directory
// This will automatically serve .br (Brotli) or .gz (gzip) files if available
const distPath = path.join(__dirname, '..', 'dist');
app.use('/', expressStaticGzip(distPath, {
  enableBrotli: true,
  orderPreference: ['br', 'gz'], // Prefer Brotli over gzip
  serveStatic: {
    maxAge: '1y', // Cache static assets for 1 year
    setHeaders: (res, path) => {
      // Set cache headers for static assets
      if (path.endsWith('.html')) {
        // Don't cache HTML files for long (SPA routing)
        res.setHeader('Cache-Control', 'no-cache');
      }
    }
  }
}));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Compression enabled: gzip & brotli`);
  console.log(`Serving static files from: ${distPath}`);
});
