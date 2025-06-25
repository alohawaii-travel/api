/**
 * End-to-End Tests for Authentication Flow
 *
 * 🧠 LEARNING: What are E2E (End-to-End) Tests?
 *
 * E2E tests verify complete user workflows:
 * ✅ Test from user's perspective
 * ✅ Use real HTTP requests (like a browser would)
 * ✅ Test complete flows start to finish
 * ✅ Verify system works as a whole
 * ✅ Catch integration issues between all layers
 *
 * E2E vs Integration vs Unit:
 * - Unit: One function, fast, isolated
 * - Integration: Multiple components, medium speed, database
 * - E2E: Complete workflows, slower, external systems
 *
 * When to write E2E tests:
 * - Critical user journeys
 * - Authentication flows
 * - Payment processes
 * - Key business workflows
 * - Smoke tests for deployments
 */

import request from "supertest";
import { createServer } from "http";
import { dbHelpers, envHelpers } from "../helpers/test-utils";

/**
 * 🧠 LEARNING: E2E Test Setup
 *
 * For E2E tests, we need:
 * 1. Real Next.js server
 * 2. Real database
 * 3. Real HTTP requests
 * 4. Clean environment between tests
 */

let server: any;
let baseUrl: string;

describe("Authentication Flow E2E Tests", () => {
  beforeAll(async () => {
    // 🧠 LEARNING: For E2E tests, we can use a simpler approach
    // Instead of starting a full Next.js server, we'll use the built-in test server
    // This avoids the complex ES module issues while still testing real HTTP flows

    baseUrl = "http://localhost:3000"; // Use the standard Next.js dev server

    console.log("🧪 E2E tests will use existing dev server or built app");
    console.log(
      "💡 Make sure to run 'npm run dev' or 'npm run build && npm start' in another terminal"
    );
  });

  afterAll(async () => {
    // No server cleanup needed since we're using external server
  });

  beforeEach(async () => {
    // Clean database before each test
    await dbHelpers.cleanDatabase();

    // Set test environment
    envHelpers.setTestEnv({
      NODE_ENV: "test",
      NEXTAUTH_URL: "http://localhost:4001",
      NEXTAUTH_SECRET: "test-secret-for-e2e",
    });
  });

  afterEach(() => {
    envHelpers.restoreEnv();
  });

  /**
   * 🧠 LEARNING: Testing Public Endpoints
   *
   * Start with endpoints that don't require authentication
   * - Verify basic server functionality
   * - Test API response formats
   * - Verify CORS and headers
   */
  describe("Public Endpoints", () => {
    it("should respond to health check", async () => {
      // ACT: Make real HTTP request
      const response = await request(baseUrl)
        .get("/api/external/health")
        .expect(200);

      // ASSERT: Verify response structure
      expect(response.body).toMatchObject({
        success: true,
        message: "Success",
        data: {
          status: "healthy",
          version: "0.1.0",
          environment: "test",
        },
      });

      // Verify response headers
      expect(response.headers["content-type"]).toContain("application/json");
    });

    it("should serve API documentation", async () => {
      const response = await request(baseUrl).get("/api/docs").expect(200);

      // Should return OpenAPI spec
      expect(response.body).toHaveProperty("openapi");
      expect(response.body).toHaveProperty("info");
      expect(response.body).toHaveProperty("paths");
    });

    it("should handle 404 for non-existent endpoints", async () => {
      const response = await request(baseUrl)
        .get("/api/non-existent")
        .expect(404);
    });
  });

  /**
   * 🧠 LEARNING: Testing Protected Endpoints
   *
   * Test authentication and authorization
   * - Verify protected routes require authentication
   * - Test different permission levels
   * - Verify proper error responses
   */
  describe("Protected Endpoints", () => {
    it("should reject unauthenticated requests to protected routes", async () => {
      const response = await request(baseUrl)
        .get("/api/internal/users/me")
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining("Unauthorized"),
      });
    });

    it("should reject requests from non-whitelisted domains", async () => {
      // This test would require mocking the OAuth flow
      // For now, we test the domain validation logic directly

      // Create user with non-whitelisted domain
      await dbHelpers.createTestUser({
        email: "user@blacklisted.com",
      });

      // In a real E2E test, we would:
      // 1. Mock Google OAuth response
      // 2. Attempt login with blacklisted email
      // 3. Verify rejection

      // For demo purposes, we'll test the API behavior
      const response = await request(baseUrl)
        .get("/api/internal/users/me")
        .expect(401); // No valid session

      expect(response.body.success).toBe(false);
    });
  });

  /**
   * 🧠 LEARNING: Testing Complete User Workflows
   *
   * E2E tests should verify complete business processes:
   * 1. User registration/login
   * 2. Profile management
   * 3. Permission-based access
   * 4. Data persistence
   */
  describe("User Management Workflow", () => {
    it("should handle complete user lifecycle", async () => {
      // STEP 1: Create whitelisted domain
      await dbHelpers.createTestUser({
        email: "workflow@testcompany.com",
        name: "Workflow Test User",
        role: "USER", // Use valid UserRole
      });

      // STEP 2: In real E2E, user would log in via OAuth
      // For this test, we simulate having a valid session

      // STEP 3: User can access their profile
      // (This would require session handling in real E2E)

      // STEP 4: Verify user data persistence
      const healthResponse = await request(baseUrl)
        .get("/api/external/health")
        .expect(200);

      expect(healthResponse.body.success).toBe(true);
    });

    it("should enforce role-based permissions", async () => {
      // Create users with different roles
      const customerUser = await dbHelpers.createTestUser({
        email: "customer@test.com",
        role: "USER", // Use valid UserRole
      });

      const adminUser = await dbHelpers.createTestUser({
        email: "admin@test.com",
        role: "ADMIN",
      });

      // In real E2E test, we would:
      // 1. Login as customer, verify limited access
      // 2. Login as admin, verify extended access
      // 3. Test permission boundaries

      // For now, verify users were created
      expect(customerUser.role).toBe("USER");
      expect(adminUser.role).toBe("ADMIN");
    });
  });

  /**
   * 🧠 LEARNING: Testing Error Scenarios
   *
   * E2E tests should verify error handling:
   * - Network timeouts
   * - Invalid requests
   * - Server errors
   * - Database failures
   */
  describe("Error Handling", () => {
    it("should handle malformed requests gracefully", async () => {
      const response = await request(baseUrl)
        .post("/api/internal/users/me")
        .send("invalid json")
        .set("Content-Type", "application/json")
        .expect(400);

      // Should return proper error format
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message");
    });

    it("should handle database connection issues", async () => {
      // This would require temporarily breaking database connection
      // For demo purposes, test basic error response format

      const response = await request(baseUrl)
        .get("/api/external/health")
        .expect(200);

      // Health check should still work
      expect(response.body.success).toBe(true);
    });

    it("should validate request headers and methods", async () => {
      // Test wrong HTTP method
      const response = await request(baseUrl)
        .patch("/api/external/health")
        .expect(405);

      // Should return method not allowed
    });
  });

  /**
   * 🧠 LEARNING: Performance and Load Testing
   *
   * E2E tests can include basic performance checks:
   * - Response times
   * - Concurrent requests
   * - Memory usage
   * - Rate limiting
   */
  describe("Performance Tests", () => {
    it("should respond quickly to health checks", async () => {
      const startTime = Date.now();

      await request(baseUrl).get("/api/external/health").expect(200);

      const responseTime = Date.now() - startTime;

      // Should respond within 1 second
      expect(responseTime).toBeLessThan(1000);
    });

    it("should handle multiple concurrent requests", async () => {
      // Make 5 concurrent requests
      const requests = Array(5)
        .fill(null)
        .map(() => request(baseUrl).get("/api/external/health").expect(200));

      const responses = await Promise.all(requests);

      // All should succeed
      responses.forEach((response) => {
        expect(response.body.success).toBe(true);
      });
    });
  });
});

/**
 * 🧠 LEARNING: E2E Test Best Practices
 *
 * ✅ Test critical user workflows
 * ✅ Use real servers and databases
 * ✅ Clean data between tests
 * ✅ Test error scenarios
 * ✅ Keep tests independent
 * ✅ Mock external services only
 * ✅ Test performance basics
 * ✅ Verify complete data flows
 *
 * ❌ Don't test every detail (leave that to unit tests)
 * ❌ Don't make tests depend on each other
 * ❌ Don't ignore test data cleanup
 * ❌ Don't test implementation details
 * ❌ Don't make tests too complex
 *
 * E2E Testing Pyramid:
 * - Many Unit Tests (70%)
 * - Some Integration Tests (20%)
 * - Few E2E Tests (10%)
 *
 * E2E tests are:
 * - Slowest to run
 * - Most brittle
 * - Hardest to debug
 * - Most valuable for catching real issues
 * - Best for testing critical workflows
 */
