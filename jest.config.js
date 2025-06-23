/**
 * Jest Configuration for Alohawaii API Testing
 *
 * 🧠 LEARNING: Why Jest?
 *
 * Jest is the most popular JavaScript testing framework because:
 * ✅ Built-in test runner, assertion library, and mocking
 * ✅ Zero-config setup for most projects
 * ✅ Great TypeScript support
 * ✅ Snapshot testing for UI components
 * ✅ Code coverage reports
 * ✅ Parallel test execution for speed
 * ✅ Watch mode for development
 *
 * Alternatives considered:
 * - Mocha + Chai + Sinon (more setup required)
 * - Vitest (newer, but less ecosystem)
 * - Jasmine (older, less features)
 */

const nextJest = require("next/jest");

// Next.js provides built-in Jest configuration optimization
// 🧠 LEARNING: This handles TypeScript compilation, path mapping, and Next.js specific setup
const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  // 🧠 LEARNING: Setup file runs before each test suite
  // Used for global mocks, test database setup, and environment configuration
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  // 🧠 LEARNING: Test environment determines the runtime context
  // 'node' = Server-side testing (API routes)
  // 'jsdom' = Browser-like environment (React components)
  testEnvironment: "node",

  // 🧠 LEARNING: Test discovery optimization
  // Ignore Next.js build files and node_modules for faster test discovery
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],

  // 🧠 LEARNING: Path mapping for imports
  // Allows us to use @/ imports in tests (same as in source code)
  // This keeps tests and source code import patterns consistent
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  // 🧠 LEARNING: Coverage configuration
  // Tracks which lines/branches/functions are tested
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts", // Exclude TypeScript declaration files
    "!src/app/layout.tsx", // Exclude boilerplate Next.js files
    "!src/app/page.tsx", // Exclude UI pages (test these with E2E)
    "!src/components/SwaggerDocs.tsx", // Exclude 3rd party wrapper components
  ],

  // 🧠 LEARNING: Coverage thresholds prevent quality regression
  // If coverage drops below these percentages, tests fail
  // This ensures new code is properly tested
  coverageThreshold: {
    global: {
      branches: 70, // 70% of code branches (if/else, switch cases)
      functions: 70, // 70% of functions must be tested
      lines: 70, // 70% of lines must be executed in tests
      statements: 70, // 70% of statements must be tested
    },
  },

  // 🧠 LEARNING: Test timeout prevents hanging tests
  // API tests might need database connections, so we allow 10 seconds
  testTimeout: 10000,

  // 🧠 LEARNING: Test patterns
  // Jest looks for files matching these patterns:
  // - tests/*.test.ts
  // - src/**/*.test.ts
  // - src/**/__tests__/*.ts
  testMatch: [
    "<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}",
    "<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}",
    "<rootDir>/src/**/*.test.{js,jsx,ts,tsx}",
  ],
};

// Export Next.js optimized configuration
module.exports = createJestConfig(customJestConfig);
