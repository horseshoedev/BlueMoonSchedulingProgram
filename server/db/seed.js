/**
 * Database Seed Script
 * Populates the database with test data for development
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./index');
const userRepo = require('../repositories/userRepository');
const groupRepo = require('../repositories/groupRepository');

async function seed() {
  try {
    console.log('Starting database seed...');

    // Create test users
    console.log('\n1. Creating test users...');

    const hashedPassword = await bcrypt.hash('password123', 10);

    const user1 = await userRepo.createUser({
      email: 'john@example.com',
      password: hashedPassword,
      name: 'John Doe',
      profileIcon: '👤',
      preferences: {
        workingHours: { start: '09:00', end: '17:00' },
        timeZone: 'America/New_York',
        preferredTimes: ['morning', 'afternoon'],
        eventTypes: ['work', 'personal'],
        timeFormat: '12',
        theme: 'light',
      },
    });
    console.log(`   Created user: ${user1.name} (${user1.email})`);

    const user2 = await userRepo.createUser({
      email: 'jane@example.com',
      password: hashedPassword,
      name: 'Jane Smith',
      profileIcon: '👩',
      preferences: {
        workingHours: { start: '10:00', end: '18:00' },
        timeZone: 'America/Los_Angeles',
        preferredTimes: ['afternoon', 'evening'],
        eventTypes: ['work', 'social'],
        timeFormat: '24',
        theme: 'dark',
      },
    });
    console.log(`   Created user: ${user2.name} (${user2.email})`);

    const user3 = await userRepo.createUser({
      email: 'bob@example.com',
      password: hashedPassword,
      name: 'Bob Wilson',
      profileIcon: '🧑',
      preferences: {
        workingHours: { start: '08:00', end: '16:00' },
        timeZone: 'America/Chicago',
        preferredTimes: ['morning'],
        eventTypes: ['work', 'personal', 'social'],
        timeFormat: '12',
        theme: 'light',
      },
    });
    console.log(`   Created user: ${user3.name} (${user3.email})`);

    // Create test groups
    console.log('\n2. Creating test groups...');

    const group1 = await groupRepo.createGroup(
      {
        name: 'Development Team',
        description: 'Software development team meetings',
        type: 'work',
      },
      user1.id
    );
    console.log(`   Created group: ${group1.name}`);

    // Add members to group
    await groupRepo.addMember(group1.id, user2.id, 'admin');
    await groupRepo.addMember(group1.id, user3.id, 'member');
    console.log(`   Added 2 members to ${group1.name}`);

    const group2 = await groupRepo.createGroup(
      {
        name: 'Book Club',
        description: 'Monthly book club meetings',
        type: 'social',
      },
      user2.id
    );
    console.log(`   Created group: ${group2.name}`);

    await groupRepo.addMember(group2.id, user1.id, 'member');
    console.log(`   Added 1 member to ${group2.name}`);

    // Success summary
    console.log('\n✅ Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - ${3} users created`);
    console.log(`   - ${2} groups created`);
    console.log('\n🔐 Test Credentials:');
    console.log('   Email: john@example.com');
    console.log('   Email: jane@example.com');
    console.log('   Email: bob@example.com');
    console.log('   Password: password123');

    // Close database connection
    await db.closePool();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    await db.closePool();
    process.exit(1);
  }
}

// Run seed
seed();
