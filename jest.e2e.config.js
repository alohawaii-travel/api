/**
 * Jest Configuration for E2E Tests
 *
 * E2E tests need different configuration than unit/integration tests:
 * - Real Next.js server startup
 * - Different module handling
 * - Longer timeouts
 * - Different environment setup
 */

const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const e2eJestConfig = {
  displayName: "E2E Tests",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/jest.e2e.setup.js"],

  // Different test pattern for E2E
  testMatch: ["<rootDir>/tests/e2e/**/*.test.{js,jsx,ts,tsx}"],

  // Longer timeout for E2E tests (starting servers takes time)
  testTimeout: 30000,

  // Module name mapping
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  // Don't collect coverage for E2E tests (they're more about integration)
  collectCoverage: false,

  // Handle ES modules properly for Next.js E2E
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": ["next/jest"],
  },

  // E2E tests run serially to avoid port conflicts
  maxWorkers: 1,

  // Ignore other test types
  testPathIgnorePatterns: [
    "<rootDir>/.next/",
    "<rootDir>/node_modules/",
    "<rootDir>/tests/unit/",
    "<rootDir>/tests/integration/",
    "<rootDir>/tests/helpers/",
  ],
};

module.exports = createJestConfig(e2eJestConfig);
