/**
 * E2E Jest Setup File
 *
 * This setup is specifically for E2E tests that start real servers
 */

import { beforeAll, afterAll } from "@jest/globals";

// Set up E2E test environment
beforeAll(async () => {
  // Set NODE_ENV for E2E tests
  process.env.NODE_ENV = "test";

  // E2E specific environment variables
  process.env.DATABASE_URL =
    "postgresql://test:test@localhost:5433/alohawaii_test";
  process.env.NEXTAUTH_URL = "http://localhost:4001";
  process.env.NEXTAUTH_SECRET = "test-secret-key-for-e2e-testing";

  // Mock external APIs in E2E environment
  process.env.GOOGLE_CLIENT_ID = "mock-google-client-id-e2e";
  process.env.GOOGLE_CLIENT_SECRET = "mock-google-client-secret-e2e";
  process.env.ALLOWED_DOMAINS = "testcompany.com,example.org";

  // Set up test API keys
  process.env.HUB_API_KEY = "test-hub-key-e2e";
  process.env.WEBSITE_API_KEY = "test-website-key-e2e";
  process.env.DEV_API_KEY = "test-dev-key-e2e";
  process.env.JWT_SECRET = "test-jwt-secret-e2e-change-in-production";
});

afterAll(async () => {
  // Cleanup any global E2E resources
});

// Don't mock anything globally for E2E tests - we want real behavior
// Individual E2E tests can mock external services if needed
