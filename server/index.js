const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
