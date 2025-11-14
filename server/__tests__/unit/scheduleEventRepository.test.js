/**
 * Unit Tests for Schedule Event Repository (NEW FEATURE)
 */

const scheduleRepo = require('../../repositories/scheduleEventRepository');
const userRepo = require('../../repositories/userRepository');
const groupRepo = require('../../repositories/groupRepository');
const db = require('../../db');

describe('Schedule Event Repository', () => {
  let testUser, testGroup;

  beforeAll(async () => {
    testUser = await userRepo.createUser({
      email: testUtils.randomEmail(),
      password: '$2a$10$hashedpassword',
      name: 'Test User'
    });

    testGroup = await groupRepo.createGroup({
      name: `Test Group ${testUtils.randomString()}`,
      description: 'Test group',
      type: 'work'
    }, testUser.id);
  });

  afterAll(async () => {
    await db.closePool();
  });

  describe('createEvent', () => {
    it('should create a new schedule event', async () => {
      const eventData = {
        createdBy: testUser.id,
        title: 'Team Meeting',
        description: 'Weekly team sync',
        startTime: '14:00',
        endTime: '15:00',
        date: '2025-12-01',
        type: 'work',
        location: 'Conference Room A'
      };

      const event = await scheduleRepo.createEvent(eventData);

      expect(event).toBeDefined();
      expect(event.id).toBeDefined();
      expect(event.title).toBe(eventData.title);
      expect(event.created_by).toBe(testUser.id);
    });

    it('should create event with group', async () => {
      const eventData = {
        createdBy: testUser.id,
        title: 'Group Meeting',
        startTime: '10:00',
        endTime: '11:00',
        date: '2025-12-02',
        groupId: testGroup.id
      };

      const event = await scheduleRepo.createEvent(eventData);

      expect(event.group_id).toBe(testGroup.id);
    });

    it('should create recurring event', async () => {
      const eventData = {
        createdBy: testUser.id,
        title: 'Daily Standup',
        startTime: '09:00',
        endTime: '09:15',
        date: '2025-12-01',
        isRecurring: true,
        recurrencePattern: { frequency: 'daily', interval: 1 }
      };

      const event = await scheduleRepo.createEvent(eventData);

      expect(event.is_recurring).toBe(true);
      expect(event.recurring_pattern).toBeDefined();
    });
  });

  describe('getEventsByUserId', () => {
    it('should return events for a user', async () => {
      await scheduleRepo.createEvent({
        createdBy: testUser.id,
        title: 'User Event',
        startTime: '10:00',
        endTime: '11:00',
        date: '2025-12-01'
      });

      const events = await scheduleRepo.getEventsByUserId(testUser.id);

      expect(Array.isArray(events)).toBe(true);
      expect(events.length).toBeGreaterThan(0);
    });
  });

  describe('getEventById', () => {
    it('should return event by id', async () => {
      const event = await scheduleRepo.createEvent({
        createdBy: testUser.id,
        title: 'Specific Event',
        startTime: '14:00',
        endTime: '15:00',
        date: '2025-12-01'
      });

      const retrieved = await scheduleRepo.getEventById(event.id);

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(event.id);
    });

    it('should return null for non-existent event', async () => {
      const event = await scheduleRepo.getEventById('00000000-0000-0000-0000-000000000000');
      expect(event).toBeNull();
    });
  });

  describe('updateEvent', () => {
    it('should update event details', async () => {
      const event = await scheduleRepo.createEvent({
        createdBy: testUser.id,
        title: 'Original Title',
        startTime: '10:00',
        endTime: '11:00',
        date: '2025-12-01'
      });

      const updates = {
        title: 'Updated Title',
        location: 'New Location'
      };

      const updated = await scheduleRepo.updateEvent(event.id, updates);

      expect(updated.title).toBe('Updated Title');
      expect(updated.location).toBe('New Location');
    });
  });

  describe('deleteEvent', () => {
    it('should delete an event', async () => {
      const event = await scheduleRepo.createEvent({
        createdBy: testUser.id,
        title: 'To Delete',
        startTime: '10:00',
        endTime: '11:00',
        date: '2025-12-01'
      });

      await scheduleRepo.deleteEvent(event.id);

      const deleted = await scheduleRepo.getEventById(event.id);
      expect(deleted).toBeNull();
    });
  });

  describe('addAttendees', () => {
    it('should add attendees to event', async () => {
      const event = await scheduleRepo.createEvent({
        createdBy: testUser.id,
        title: 'Event with Attendees',
        startTime: '10:00',
        endTime: '11:00',
        date: '2025-12-01'
      });

      await scheduleRepo.addAttendees(event.id, [testUser.id]);

      const retrieved = await scheduleRepo.getEventById(event.id);
      expect(retrieved.attendees).toBeDefined();
      expect(Array.isArray(retrieved.attendees)).toBe(true);
    });
  });

  describe('removeAllAttendees', () => {
    it('should remove all attendees from event', async () => {
      const event = await scheduleRepo.createEvent({
        createdBy: testUser.id,
        title: 'Event',
        startTime: '10:00',
        endTime: '11:00',
        date: '2025-12-01'
      });

      await scheduleRepo.addAttendees(event.id, [testUser.id]);
      await scheduleRepo.removeAllAttendees(event.id);

      const retrieved = await scheduleRepo.getEventById(event.id);
      expect(retrieved.attendees.length).toBe(0);
    });
  });
});
