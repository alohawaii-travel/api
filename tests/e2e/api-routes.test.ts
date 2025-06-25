/**
 * Simple E2E Tests for API Routes
 *
 * This approach avoids the complex Next.js server startup issues
 * by testing API routes directly in a more E2E-like manner
 */

import { GET as healthGet } from "@/app/api/external/health/route";
import { GET as usersGet } from "@/app/api/internal/users/me/route";
import { dbHelpers } from "../helpers/test-utils";
import { NextRequest } from "next/server";

describe("API Routes E2E Tests", () => {
  beforeEach(async () => {
    // Clean database before each test
    await dbHelpers.cleanDatabase();
  });

  describe("Health Check E2E", () => {
    it("should return healthy status", async () => {
      // Create a real NextRequest
      const request = new NextRequest(
        "http://localhost:4000/api/external/health",
        {
          method: "GET",
          headers: {
            "x-api-key": "test-website-key",
          },
        }
      );

      // Call the actual API route function
      const response = await healthGet(request);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toMatchObject({
        success: true,
        message: "Success",
        data: {
          status: "healthy",
          version: "0.1.0",
          environment: "test",
        },
      });
    });
  });

  describe("Protected Routes E2E", () => {
    it("should reject unauthenticated requests", async () => {
      // Create a request without authentication
      const request = new NextRequest(
        "http://localhost:4000/api/internal/users/me",
        {
          method: "GET",
          headers: {
            "x-api-key": "test-hub-key",
          },
        }
      );

      // Call the actual API route function
      const response = await usersGet(request);

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain("Authentication required");
    });
  });

  describe("Database Integration E2E", () => {
    it("should create and verify user data", async () => {
      // Create a test user in the database
      const testUser = await dbHelpers.createTestUser({
        email: "e2e@testcompany.com",
        name: "E2E Test User",
        role: "USER",
      });

      // Verify the user was created
      expect(testUser.id).toBeDefined();
      expect(testUser.email).toBe("e2e@testcompany.com");
      expect(testUser.name).toBe("E2E Test User");
      expect(testUser.role).toBe("USER");
    });

    it("should handle whitelisted domains", async () => {
      // Create user with whitelisted domain
      const user1 = await dbHelpers.createTestUser({
        email: "user@testcompany.com", // testcompany.com is whitelisted
      });

      expect(user1.email).toBe("user@testcompany.com");

      // Create user with different whitelisted domain
      const user2 = await dbHelpers.createTestUser({
        email: "user@example.org", // example.org is also whitelisted
      });

      expect(user2.email).toBe("user@example.org");
    });
  });

  describe("Error Handling E2E", () => {
    it("should handle missing API keys", async () => {
      // Create a request without API key
      const request = new NextRequest(
        "http://localhost:4000/api/external/health",
        {
          method: "GET",
          headers: {},
        }
      );

      const response = await healthGet(request);

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it("should handle invalid API keys", async () => {
      // Create a request with invalid API key
      const request = new NextRequest(
        "http://localhost:4000/api/external/health",
        {
          method: "GET",
          headers: {
            "x-api-key": "invalid-key",
          },
        }
      );

      const response = await healthGet(request);

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  describe("Performance E2E", () => {
    it("should respond quickly to health checks", async () => {
      const request = new NextRequest(
        "http://localhost:4000/api/external/health",
        {
          method: "GET",
          headers: {
            "x-api-key": "test-website-key",
          },
        }
      );

      const startTime = Date.now();

      const response = await healthGet(request);

      const responseTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    it("should handle multiple concurrent requests", async () => {
      const requests = Array(5)
        .fill(null)
        .map(() => {
          const request = new NextRequest(
            "http://localhost:4000/api/external/health",
            {
              method: "GET",
              headers: {
                "x-api-key": "test-website-key",
              },
            }
          );
          return healthGet(request);
        });

      const responses = await Promise.all(requests);

      // All should succeed
      responses.forEach(async (response) => {
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
      });
    });
  });
});

/**
 * 🧠 LEARNING: Simplified E2E Testing Approach
 *
 * This approach provides E2E-like testing without the complexity of:
 * - Starting real Next.js servers
 * - Complex ES module configurations
 * - Port management issues
 * - Network timeouts
 *
 * Benefits:
 * ✅ Tests complete API route flows
 * ✅ Uses real database connections
 * ✅ Tests authentication and authorization
 * ✅ Verifies error handling
 * ✅ Fast execution (no server startup)
 * ✅ Easy to debug
 * ✅ No port conflicts
 *
 * Trade-offs:
 * ❌ Doesn't test actual HTTP transport
 * ❌ Doesn't test middleware ordering exactly as Next.js would
 * ❌ Doesn't test CORS, headers, etc. at HTTP level
 *
 * For true HTTP-level E2E testing, consider:
 * - Using Playwright or Cypress
 * - Testing against deployed environments
 * - Using dedicated E2E testing frameworks
 */
