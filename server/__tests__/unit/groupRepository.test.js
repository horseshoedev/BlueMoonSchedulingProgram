/**
 * Unit Tests for Group Repository
 */

const groupRepo = require('../../repositories/groupRepository');
const userRepo = require('../../repositories/userRepository');
const db = require('../../db');

describe('Group Repository', () => {
  let testUser1, testUser2;

  // Create test users before tests
  beforeAll(async () => {
    testUser1 = await userRepo.createUser({
      email: testUtils.randomEmail(),
      password: '$2a$10$hashedpassword',
      name: 'Test User 1'
    });

    testUser2 = await userRepo.createUser({
      email: testUtils.randomEmail(),
      password: '$2a$10$hashedpassword',
      name: 'Test User 2'
    });
  });

  afterAll(async () => {
    await db.closePool();
  });

  describe('createGroup', () => {
    it('should create a new group with owner', async () => {
      const groupData = {
        name: `Test Group ${testUtils.randomString()}`,
        description: 'Test description',
        type: 'work'
      };

      const group = await groupRepo.createGroup(groupData, testUser1.id);

      expect(group).toBeDefined();
      expect(group.id).toBeDefined();
      expect(group.name).toBe(groupData.name);
      expect(group.description).toBe(groupData.description);
      expect(group.type).toBe(groupData.type);
      expect(group.createdBy).toBe(testUser1.id);
    });

    it('should automatically add creator as owner member', async () => {
      const groupData = {
        name: `Test Group ${testUtils.randomString()}`,
        description: 'Test description',
        type: 'work'
      };

      const group = await groupRepo.createGroup(groupData, testUser1.id);
      const role = await groupRepo.getMemberRole(group.id, testUser1.id);

      expect(role).toBe('owner');
    });
  });

  describe('getGroupsByUserId', () => {
    it('should return all groups for a user', async () => {
      const group1 = await groupRepo.createGroup({
        name: `Group 1 ${testUtils.randomString()}`,
        description: 'Group 1',
        type: 'work'
      }, testUser1.id);

      const group2 = await groupRepo.createGroup({
        name: `Group 2 ${testUtils.randomString()}`,
        description: 'Group 2',
        type: 'social'
      }, testUser1.id);

      const groups = await groupRepo.getGroupsByUserId(testUser1.id);

      expect(groups.length).toBeGreaterThanOrEqual(2);
      expect(groups.some(g => g.id === group1.id)).toBe(true);
      expect(groups.some(g => g.id === group2.id)).toBe(true);
    });

    it('should return empty array for user with no groups', async () => {
      const newUser = await userRepo.createUser({
        email: testUtils.randomEmail(),
        password: '$2a$10$hashedpassword',
        name: 'No Groups User'
      });

      const groups = await groupRepo.getGroupsByUserId(newUser.id);
      expect(Array.isArray(groups)).toBe(true);
    });
  });

  describe('getGroupById', () => {
    it('should return group by id', async () => {
      const group = await groupRepo.createGroup({
        name: `Test Group ${testUtils.randomString()}`,
        description: 'Test',
        type: 'work'
      }, testUser1.id);

      const retrieved = await groupRepo.getGroupById(group.id);

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(group.id);
      expect(retrieved.name).toBe(group.name);
    });

    it('should return null for non-existent group', async () => {
      const group = await groupRepo.getGroupById('00000000-0000-0000-0000-000000000000');
      expect(group).toBeNull();
    });
  });

  describe('updateGroup', () => {
    it('should update group details', async () => {
      const group = await groupRepo.createGroup({
        name: `Original Name ${testUtils.randomString()}`,
        description: 'Original description',
        type: 'work'
      }, testUser1.id);

      const updates = {
        name: 'Updated Name',
        description: 'Updated description'
      };

      const updated = await groupRepo.updateGroup(group.id, updates);

      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe('Updated description');
    });
  });

  describe('softDeleteGroup', () => {
    it('should soft delete a group', async () => {
      const group = await groupRepo.createGroup({
        name: `Delete Test ${testUtils.randomString()}`,
        description: 'To be deleted',
        type: 'work'
      }, testUser1.id);

      await groupRepo.softDeleteGroup(group.id);

      const deleted = await groupRepo.getGroupById(group.id);
      expect(deleted).toBeNull();
    });
  });

  describe('addMember', () => {
    it('should add a member to group', async () => {
      const group = await groupRepo.createGroup({
        name: `Group ${testUtils.randomString()}`,
        description: 'Test',
        type: 'work'
      }, testUser1.id);

      await groupRepo.addMember(group.id, testUser2.id, 'member');

      const isMember = await groupRepo.isMember(group.id, testUser2.id);
      expect(isMember).toBe(true);
    });

    it('should add member with specified role', async () => {
      const group = await groupRepo.createGroup({
        name: `Group ${testUtils.randomString()}`,
        description: 'Test',
        type: 'work'
      }, testUser1.id);

      await groupRepo.addMember(group.id, testUser2.id, 'admin');

      const role = await groupRepo.getMemberRole(group.id, testUser2.id);
      expect(role).toBe('admin');
    });
  });

  describe('removeMember', () => {
    it('should remove a member from group', async () => {
      const group = await groupRepo.createGroup({
        name: `Group ${testUtils.randomString()}`,
        description: 'Test',
        type: 'work'
      }, testUser1.id);

      await groupRepo.addMember(group.id, testUser2.id, 'member');
      await groupRepo.removeMember(group.id, testUser2.id);

      const isMember = await groupRepo.isMember(group.id, testUser2.id);
      expect(isMember).toBe(false);
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role', async () => {
      const group = await groupRepo.createGroup({
        name: `Group ${testUtils.randomString()}`,
        description: 'Test',
        type: 'work'
      }, testUser1.id);

      await groupRepo.addMember(group.id, testUser2.id, 'member');
      await groupRepo.updateMemberRole(group.id, testUser2.id, 'admin');

      const role = await groupRepo.getMemberRole(group.id, testUser2.id);
      expect(role).toBe('admin');
    });
  });

  describe('getMemberRole', () => {
    it('should return member role', async () => {
      const group = await groupRepo.createGroup({
        name: `Group ${testUtils.randomString()}`,
        description: 'Test',
        type: 'work'
      }, testUser1.id);

      const role = await groupRepo.getMemberRole(group.id, testUser1.id);
      expect(role).toBe('owner');
    });

    it('should return null for non-member', async () => {
      const group = await groupRepo.createGroup({
        name: `Group ${testUtils.randomString()}`,
        description: 'Test',
        type: 'work'
      }, testUser1.id);

      const role = await groupRepo.getMemberRole(group.id, testUser2.id);
      expect(role).toBeNull();
    });
  });

  describe('isMember', () => {
    it('should return true for group member', async () => {
      const group = await groupRepo.createGroup({
        name: `Group ${testUtils.randomString()}`,
        description: 'Test',
        type: 'work'
      }, testUser1.id);

      const result = await groupRepo.isMember(group.id, testUser1.id);
      expect(result).toBe(true);
    });

    it('should return false for non-member', async () => {
      const group = await groupRepo.createGroup({
        name: `Group ${testUtils.randomString()}`,
        description: 'Test',
        type: 'work'
      }, testUser1.id);

      const result = await groupRepo.isMember(group.id, testUser2.id);
      expect(result).toBe(false);
    });
  });
});
