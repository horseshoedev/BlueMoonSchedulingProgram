/**
 * Unit Tests for User Repository
 */

const userRepo = require('../../repositories/userRepository');
const db = require('../../db');

describe('User Repository', () => {
  // Clean up after all tests
  afterAll(async () => {
    await db.closePool();
  });

  describe('createUser', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        email: testUtils.randomEmail(),
        password: '$2a$10$hashedpassword', // Prehashed password
        name: 'Test User',
        profileIcon: '👤',
        preferences: {
          workingHours: { start: '09:00', end: '17:00' },
          timeZone: 'UTC'
        }
      };

      const user = await userRepo.createUser(userData);

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.password).toBeUndefined(); // Should not return password
    });

    it('should throw error for duplicate email', async () => {
      const email = testUtils.randomEmail();
      const userData = {
        email,
        password: '$2a$10$hashedpassword',
        name: 'Test User'
      };

      // Create first user
      await userRepo.createUser(userData);

      // Attempt to create duplicate
      await expect(userRepo.createUser(userData)).rejects.toThrow();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const email = testUtils.randomEmail();
      const userData = {
        email,
        password: '$2a$10$hashedpassword',
        name: 'Test User'
      };

      await userRepo.createUser(userData);
      const user = await userRepo.findByEmail(email);

      expect(user).toBeDefined();
      expect(user.email).toBe(email);
      expect(user.password).toBeUndefined();
    });

    it('should return null for non-existent email', async () => {
      const user = await userRepo.findByEmail('nonexistent@example.com');
      expect(user).toBeNull();
    });

    it('should include password when requested', async () => {
      const email = testUtils.randomEmail();
      const userData = {
        email,
        password: '$2a$10$hashedpassword',
        name: 'Test User'
      };

      await userRepo.createUser(userData);
      const user = await userRepo.findByEmail(email, true);

      expect(user).toBeDefined();
      expect(user.password).toBeDefined();
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const userData = {
        email: testUtils.randomEmail(),
        password: '$2a$10$hashedpassword',
        name: 'Test User'
      };

      const createdUser = await userRepo.createUser(userData);
      const user = await userRepo.findById(createdUser.id);

      expect(user).toBeDefined();
      expect(user.id).toBe(createdUser.id);
      expect(user.email).toBe(userData.email);
    });

    it('should return null for non-existent id', async () => {
      const user = await userRepo.findById('00000000-0000-0000-0000-000000000000');
      expect(user).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const userData = {
        email: testUtils.randomEmail(),
        password: '$2a$10$hashedpassword',
        name: 'Old Name'
      };

      const user = await userRepo.createUser(userData);

      const updates = {
        name: 'New Name',
        profileIcon: '🎉'
      };

      const updated = await userRepo.updateProfile(user.id, updates);

      expect(updated.name).toBe('New Name');
      expect(updated.profileIcon).toBe('🎉');
    });
  });

  describe('updatePassword', () => {
    it('should update user password', async () => {
      const userData = {
        email: testUtils.randomEmail(),
        password: '$2a$10$oldpassword',
        name: 'Test User'
      };

      const user = await userRepo.createUser(userData);
      const newPassword = '$2a$10$newpassword';

      await userRepo.updatePassword(user.id, newPassword);

      const updatedUser = await userRepo.findByEmail(user.email, true);
      expect(updatedUser.password).toBe(newPassword);
    });
  });

  describe('softDeleteUser', () => {
    it('should soft delete a user', async () => {
      const userData = {
        email: testUtils.randomEmail(),
        password: '$2a$10$hashedpassword',
        name: 'Test User'
      };

      const user = await userRepo.createUser(userData);
      await userRepo.softDeleteUser(user.id);

      const deletedUser = await userRepo.findById(user.id);
      expect(deletedUser).toBeNull(); // Soft deleted users should not be findable
    });
  });
});
