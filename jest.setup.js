/**
 * Global Jest Setup File
 *
 * 🧠 LEARNING: Why do we need global setup?
 *
 * In testing, we need:
 * 1. Isolated environment (doesn't affect real data)
 * 2. Predictable test data (same results every time)
 * 3. Fast execution (no real external API calls)
 * 4. Repeatable tests (can run multiple times)
 *
 * This file runs before each test suite and configures:
 * - Environment variables for testing
 * - Global mocks for external services (Google OAuth, etc.)
 * - Database setup utilities
 * - Test data helpers
 */

import { beforeAll, afterAll } from "@jest/globals";

/**
 * 🧠 LEARNING: Test Environment Setup
 *
 * Why separate test environment?
 * - Prevents tests from affecting development/production data
 * - Allows destructive operations (database cleanup)
 * - Enables predictable test conditions
 * - Faster execution with test-optimized settings
 */
beforeAll(async () => {
  // Set NODE_ENV first
  process.env.NODE_ENV = "test";

  // Use separate test database to avoid contaminating development data
  process.env.DATABASE_URL =
    "postgresql://test:test@localhost:5433/alohawaii_test";
  process.env.NEXTAUTH_URL = "http://localhost:4000";
  process.env.NEXTAUTH_SECRET = "test-secret-key-for-testing";

  // Mock external APIs in test environment
  // 🧠 LEARNING: We don't want real Google OAuth during tests
  process.env.GOOGLE_CLIENT_ID = "mock-google-client-id";
  process.env.GOOGLE_CLIENT_SECRET = "mock-google-client-secret";
  process.env.ALLOWED_DOMAINS = "testcompany.com,example.org";

  // Set up test API keys
  process.env.HUB_API_KEY = "test-hub-key";
  process.env.WEBSITE_API_KEY = "test-website-key";
  process.env.DEV_API_KEY = "test-dev-key";
  process.env.JWT_SECRET = "test-jwt-secret-change-in-production";
});

afterAll(async () => {
  // Cleanup any global resources
  // This runs after all tests complete
});

/**
 * 🧠 LEARNING: Mocking External Dependencies
 *
 * Why mock NextAuth.js?
 * ✅ We don't want real Google OAuth in tests
 * ✅ We need predictable authentication states
 * ✅ Tests should run without internet connection
 * ✅ Tests should run fast (no external API delays)
 * ✅ We can test different authentication scenarios
 *
 * What is mocking?
 * - Replace real functions with fake ones
 * - Control what the fake functions return
 * - Track how many times they were called
 * - Test different scenarios (success, failure, edge cases)
 */
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

/**
 * 🧠 LEARNING: Database Mocking Strategy
 *
 * For different test types, we use different approaches:
 *
 * UNIT TESTS: Mock Prisma completely
 * - No real database connection
 * - Fastest execution
 * - Test business logic only
 *
 * INTEGRATION TESTS: Use real test database
 * - Test actual database queries
 * - Verify data persistence
 * - Test complex database operations
 *
 * E2E TESTS: Use real test database
 * - Test complete user workflows
 * - Verify entire system integration
 */

// Mock Prisma Client for Unit Tests only
// 🧠 LEARNING: This mock will be overridden in integration tests
const mockPrismaClient = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
  },
  whitelistedDomain: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  },
  $disconnect: jest.fn(),
};

// Mock @/lib/db only for unit tests
// Integration and E2E tests should use the real database
// Individual unit tests can add their own mocks as needed

// Export mock for use in tests
export { mockPrismaClient };
