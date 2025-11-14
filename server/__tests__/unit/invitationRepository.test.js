/**
 * Unit Tests for Invitation Repository
 */

const invitationRepo = require('../../repositories/invitationRepository');
const userRepo = require('../../repositories/userRepository');
const groupRepo = require('../../repositories/groupRepository');
const db = require('../../db');

describe('Invitation Repository', () => {
  let testUser1, testUser2, testUser3, testGroup;

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

    testUser3 = await userRepo.createUser({
      email: testUtils.randomEmail(),
      password: '$2a$10$hashedpassword',
      name: 'Test User 3'
    });

    testGroup = await groupRepo.createGroup({
      name: `Test Group ${testUtils.randomString()}`,
      description: 'Test group for invitations',
      type: 'work'
    }, testUser1.id);
  });

  afterAll(async () => {
    await db.closePool();
  });

  describe('createInvitation', () => {
    it('should create a new invitation', async () => {
      const invitation = await invitationRepo.createInvitation({
        fromUserId: testUser1.id,
        toUserId: testUser2.id,
        groupId: testGroup.id
      });

      expect(invitation).toBeDefined();
      expect(invitation.id).toBeDefined();
      expect(invitation.fromUserId).toBe(testUser1.id);
      expect(invitation.toUserId).toBe(testUser2.id);
      expect(invitation.groupId).toBe(testGroup.id);
      expect(invitation.status).toBe('pending');
    });

    it('should throw error for duplicate pending invitation', async () => {
      const inviteData = {
        fromUserId: testUser1.id,
        toUserId: testUser3.id,
        groupId: testGroup.id
      };

      await invitationRepo.createInvitation(inviteData);
      await expect(invitationRepo.createInvitation(inviteData)).rejects.toThrow();
    });
  });

  describe('getInvitationsByUserId', () => {
    it('should return all invitations for a user', async () => {
      const newUser = await userRepo.createUser({
        email: testUtils.randomEmail(),
        password: '$2a$10$hashedpassword',
        name: 'Invited User'
      });

      await invitationRepo.createInvitation({
        fromUserId: testUser1.id,
        toUserId: newUser.id,
        groupId: testGroup.id
      });

      const invitations = await invitationRepo.getInvitationsByUserId(newUser.id);

      expect(Array.isArray(invitations)).toBe(true);
      expect(invitations.length).toBeGreaterThan(0);
      expect(invitations.some(i => i.toUserId === newUser.id)).toBe(true);
    });

    it('should filter by status when provided', async () => {
      const newUser = await userRepo.createUser({
        email: testUtils.randomEmail(),
        password: '$2a$10$hashedpassword',
        name: 'Status Filter User'
      });

      const invitation = await invitationRepo.createInvitation({
        fromUserId: testUser1.id,
        toUserId: newUser.id,
        groupId: testGroup.id
      });

      const pendingInvitations = await invitationRepo.getInvitationsByUserId(newUser.id, 'pending');

      expect(pendingInvitations.every(i => i.status === 'pending')).toBe(true);
    });
  });

  describe('getInvitationById', () => {
    it('should return invitation by id', async () => {
      const newUser = await userRepo.createUser({
        email: testUtils.randomEmail(),
        password: '$2a$10$hashedpassword',
        name: 'GetById User'
      });

      const invitation = await invitationRepo.createInvitation({
        fromUserId: testUser1.id,
        toUserId: newUser.id,
        groupId: testGroup.id
      });

      const retrieved = await invitationRepo.getInvitationById(invitation.id);

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(invitation.id);
    });

    it('should return null for non-existent invitation', async () => {
      const invitation = await invitationRepo.getInvitationById('00000000-0000-0000-0000-000000000000');
      expect(invitation).toBeNull();
    });
  });

  describe('updateInvitationStatus', () => {
    it('should update invitation status to accepted', async () => {
      const newUser = await userRepo.createUser({
        email: testUtils.randomEmail(),
        password: '$2a$10$hashedpassword',
        name: 'Accept User'
      });

      const invitation = await invitationRepo.createInvitation({
        fromUserId: testUser1.id,
        toUserId: newUser.id,
        groupId: testGroup.id
      });

      const updated = await invitationRepo.updateInvitationStatus(invitation.id, 'accepted');

      expect(updated.status).toBe('accepted');
      expect(updated.respondedAt).toBeDefined();
    });

    it('should update invitation status to declined', async () => {
      const newUser = await userRepo.createUser({
        email: testUtils.randomEmail(),
        password: '$2a$10$hashedpassword',
        name: 'Decline User'
      });

      const invitation = await invitationRepo.createInvitation({
        fromUserId: testUser1.id,
        toUserId: newUser.id,
        groupId: testGroup.id
      });

      const updated = await invitationRepo.updateInvitationStatus(invitation.id, 'declined');

      expect(updated.status).toBe('declined');
    });
  });

  describe('invitationExists', () => {
    it('should return true if pending invitation exists', async () => {
      const newUser = await userRepo.createUser({
        email: testUtils.randomEmail(),
        password: '$2a$10$hashedpassword',
        name: 'Exists User'
      });

      await invitationRepo.createInvitation({
        fromUserId: testUser1.id,
        toUserId: newUser.id,
        groupId: testGroup.id
      });

      const exists = await invitationRepo.invitationExists(testGroup.id, newUser.id);

      expect(exists).toBe(true);
    });

    it('should return false if no pending invitation exists', async () => {
      const newUser = await userRepo.createUser({
        email: testUtils.randomEmail(),
        password: '$2a$10$hashedpassword',
        name: 'No Invite User'
      });

      const exists = await invitationRepo.invitationExists(testGroup.id, newUser.id);

      expect(exists).toBe(false);
    });
  });

  describe('deleteInvitation', () => {
    it('should delete an invitation', async () => {
      const newUser = await userRepo.createUser({
        email: testUtils.randomEmail(),
        password: '$2a$10$hashedpassword',
        name: 'Delete User'
      });

      const invitation = await invitationRepo.createInvitation({
        fromUserId: testUser1.id,
        toUserId: newUser.id,
        groupId: testGroup.id
      });

      await invitationRepo.deleteInvitation(invitation.id);

      const deleted = await invitationRepo.getInvitationById(invitation.id);
      expect(deleted).toBeNull();
    });
  });

  describe('getPendingInvitationsCount', () => {
    it('should return count of pending invitations', async () => {
      const newUser = await userRepo.createUser({
        email: testUtils.randomEmail(),
        password: '$2a$10$hashedpassword',
        name: 'Count User'
      });

      await invitationRepo.createInvitation({
        fromUserId: testUser1.id,
        toUserId: newUser.id,
        groupId: testGroup.id
      });

      const count = await invitationRepo.getPendingInvitationsCount(newUser.id);

      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThan(0);
    });

    it('should return 0 for user with no pending invitations', async () => {
      const newUser = await userRepo.createUser({
        email: testUtils.randomEmail(),
        password: '$2a$10$hashedpassword',
        name: 'No Pending User'
      });

      const count = await invitationRepo.getPendingInvitationsCount(newUser.id);

      expect(count).toBe(0);
    });
  });
});
