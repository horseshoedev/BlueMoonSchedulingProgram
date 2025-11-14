/**
 * Test Setup and Configuration
 * Runs before all tests
 */

require('dotenv').config();

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'bluemoon_scheduler_test';

// Increase test timeout for database operations
jest.setTimeout(10000);

// Global test utilities
global.testUtils = {
  // Generate random email for tests
  randomEmail: () => `test${Date.now()}${Math.random().toString(36).substring(7)}@example.com`,

  // Generate random string
  randomString: (length = 10) => Math.random().toString(36).substring(2, 2 + length),

  // Wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

// Suppress console errors during tests (optional)
// global.console.error = jest.fn();

console.log('Test environment initialized');
console.log(`Using database: ${process.env.DB_NAME}`);
