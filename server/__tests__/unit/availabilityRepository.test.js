/**
 * Unit Tests for Availability Repository (NEW FEATURE)
 */

const availabilityRepo = require('../../repositories/availabilityRepository');
const userRepo = require('../../repositories/userRepository');
const db = require('../../db');

describe('Availability Repository', () => {
  let testUser;

  beforeAll(async () => {
    testUser = await userRepo.createUser({
      email: testUtils.randomEmail(),
      password: '$2a$10$hashedpassword',
      name: 'Test User'
    });
  });

  afterAll(async () => {
    await db.closePool();
  });

  describe('createAvailability', () => {
    it('should create a fully free availability block', async () => {
      const availabilityData = {
        userId: testUser.id,
        type: 'fully_free',
        date: '2025-12-01',
        startTime: '09:00',
        endTime: '17:00'
      };

      const availability = await availabilityRepo.createAvailability(availabilityData);

      expect(availability).toBeDefined();
      expect(availability.id).toBeDefined();
      expect(availability.user_id).toBe(testUser.id);
      expect(availability.type).toBe('fully_free');
    });

    it('should create a partially free availability block', async () => {
      const availabilityData = {
        userId: testUser.id,
        type: 'partially_free',
        date: '2025-12-02',
        startTime: '14:00',
        endTime: '16:00'
      };

      const availability = await availabilityRepo.createAvailability(availabilityData);

      expect(availability.type).toBe('partially_free');
    });

    it('should create a recurring availability block', async () => {
      const availabilityData = {
        userId: testUser.id,
        type: 'recurring',
        dayOfWeek: 'monday',
        recurringStartTime: '09:00',
        recurringEndTime: '17:00'
      };

      const availability = await availabilityRepo.createAvailability(availabilityData);

      expect(availability.type).toBe('recurring');
      expect(availability.day_of_week).toBe('monday');
    });
  });

  describe('getAvailabilityByUserId', () => {
    it('should return all availability blocks for a user', async () => {
      await availabilityRepo.createAvailability({
        userId: testUser.id,
        type: 'fully_free',
        date: '2025-12-05',
        startTime: '09:00',
        endTime: '17:00'
      });

      const blocks = await availabilityRepo.getAvailabilityByUserId(testUser.id);

      expect(Array.isArray(blocks)).toBe(true);
      expect(blocks.length).toBeGreaterThan(0);
      expect(blocks.every(b => b.user_id === testUser.id)).toBe(true);
    });
  });

  describe('getAvailabilityById', () => {
    it('should return availability block by id', async () => {
      const block = await availabilityRepo.createAvailability({
        userId: testUser.id,
        type: 'fully_free',
        date: '2025-12-10',
        startTime: '10:00',
        endTime: '12:00'
      });

      const retrieved = await availabilityRepo.getAvailabilityById(block.id);

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(block.id);
    });

    it('should return null for non-existent block', async () => {
      const block = await availabilityRepo.getAvailabilityById('00000000-0000-0000-0000-000000000000');
      expect(block).toBeNull();
    });
  });

  describe('updateAvailability', () => {
    it('should update availability block', async () => {
      const block = await availabilityRepo.createAvailability({
        userId: testUser.id,
        type: 'fully_free',
        date: '2025-12-15',
        startTime: '09:00',
        endTime: '17:00'
      });

      const updates = {
        startTime: '10:00',
        endTime: '16:00'
      };

      const updated = await availabilityRepo.updateAvailability(block.id, updates);

      expect(updated.start_time).toBe('10:00:00');
      expect(updated.end_time).toBe('16:00:00');
    });
  });

  describe('deleteAvailability', () => {
    it('should delete an availability block', async () => {
      const block = await availabilityRepo.createAvailability({
        userId: testUser.id,
        type: 'fully_free',
        date: '2025-12-20',
        startTime: '09:00',
        endTime: '17:00'
      });

      await availabilityRepo.deleteAvailability(block.id);

      const deleted = await availabilityRepo.getAvailabilityById(block.id);
      expect(deleted).toBeNull();
    });
  });

  describe('getAvailabilityByUserIdAndDateRange', () => {
    it('should return availability blocks within date range', async () => {
      await availabilityRepo.createAvailability({
        userId: testUser.id,
        type: 'fully_free',
        date: '2025-12-25',
        startTime: '09:00',
        endTime: '17:00'
      });

      const blocks = await availabilityRepo.getAvailabilityByUserIdAndDateRange(
        testUser.id,
        '2025-12-20',
        '2025-12-31'
      );

      expect(Array.isArray(blocks)).toBe(true);
      expect(blocks.length).toBeGreaterThan(0);
    });
  });
});
