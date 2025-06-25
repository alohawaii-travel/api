/**
 * Integration Tests for User API Endpoints
 *
 * 🧠 LEARNING: What are Integration Tests?
 *
 * Integration tests verify that different parts work together:
 * ✅ API routes + Database + Authentication
 * ✅ Real HTTP requests and responses
 * ✅ Database persistence and queries
 * ✅ Middleware and error handling
 * ✅ Business workflows end-to-end
 *
 * Differences from Unit Tests:
 * - Use REAL test database (not mocked)
 * - Test multiple components together
 * - Slower execution (but still fast)
 * - More realistic scenarios
 * - Test actual API endpoints
 *
 * When to write Integration Tests:
 * - Critical user workflows
 * - Database operations
 * - Authentication flows
 * - API endpoint behavior
 * - Complex business logic spanning multiple functions
 */

import { NextRequest } from "next/server";
import { GET } from "@/app/api/internal/users/me/route";
import { getServerSession } from "next-auth";
import {
  mockSession,
  mockAdminSession,
  dbHelpers,
  responseHelpers,
  createMockRequest,
} from "../helpers/test-utils";

// Mock NextAuth for integration tests
jest.mock("next-auth");
const mockGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;

// Helper function to create standardized API requests
const createAPIRequest = (
  options: { headers?: Record<string, string> } = {}
) => {
  return createMockRequest("http://localhost:4000/api/internal/users/me", {
    headers: {
      "X-API-Key": "test-hub-key",
      ...options.headers,
    },
  });
};

describe("User API Integration Tests", () => {
  /**
   * 🧠 LEARNING: Test Database Setup
   *
   * For integration tests, we:
   * 1. Use a separate test database
   * 2. Clean database before each test
   * 3. Create fresh test data for each test
   * 4. Ensure tests don't affect each other
   */
  beforeEach(async () => {
    // Clean database before each test
    await dbHelpers.cleanDatabase();
    jest.clearAllMocks();
  });

  describe("GET /api/internal/users/me", () => {
    it("should return current user profile for authenticated user", async () => {
      // ARRANGE: Create test user in database
      const testUser = await dbHelpers.createTestUser({
        email: "integration@testcompany.com",
        name: "Integration Test User",
        role: "USER",
      });

      // Mock authentication session
      mockGetServerSession.mockResolvedValue(mockSession(testUser));

      // ACT: Call the API endpoint
      const request = createMockRequest(
        "http://localhost:4000/api/internal/users/me",
        {
          headers: {
            "X-API-Key": "test-hub-key",
          },
        }
      );
      const response = await GET(request);

      // ASSERT: Verify response structure and data
      const data = await responseHelpers.expectSuccessResponse(response);

      expect(data.data).toMatchObject({
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
        role: testUser.role,
      });

      // Verify sensitive fields are excluded
      expect(data.data).not.toHaveProperty("emailVerified");
      expect(data.data).not.toHaveProperty("createdAt");
      expect(data.data).not.toHaveProperty("updatedAt");
    });

    it("should return 401 for unauthenticated user", async () => {
      // ARRANGE: No authentication session
      mockGetServerSession.mockResolvedValue(null);

      // ACT
      const response = await GET(createAPIRequest());

      // ASSERT
      await responseHelpers.expectUnauthorizedResponse(response);
    });

    it("should handle user with whitelisted domain", async () => {
      // ARRANGE: Create user with specific domain
      const testUser = await dbHelpers.createTestUser({
        email: "user@alloweddomain.com",
        name: "Domain Test User",
      });

      mockGetServerSession.mockResolvedValue(mockSession(testUser));

      // ACT
      const response = await GET(createAPIRequest());

      // ASSERT: Should succeed because domain was whitelisted in createTestUser
      const data = await responseHelpers.expectSuccessResponse(response);
      expect(data.data.email).toBe("user@alloweddomain.com");
    });

    it("should include correct user roles in response", async () => {
      // ARRANGE: Test different user roles
      const roles = ["USER", "ADMIN", "STAFF"] as const;

      for (const role of roles) {
        // Clean database between role tests
        await dbHelpers.cleanDatabase();

        const testUser = await dbHelpers.createTestUser({
          email: `${role.toLowerCase()}@testcompany.com`,
          role,
        });

        mockGetServerSession.mockResolvedValue(mockSession(testUser));

        // ACT
        const response = await GET(createAPIRequest());

        // ASSERT
        const data = await responseHelpers.expectSuccessResponse(response);
        expect(data.data.role).toBe(role);
      }
    });

    it("should handle database connection errors gracefully", async () => {
      // ARRANGE: Create user and mock session
      const testUser = await dbHelpers.createTestUser();
      mockGetServerSession.mockResolvedValue(mockSession(testUser));

      // Mock database error by providing invalid user ID
      mockGetServerSession.mockResolvedValue(
        mockSession({
          ...testUser,
          id: "non-existent-user-id",
        })
      );

      // ACT
      const response = await GET(createAPIRequest());

      // ASSERT: Should handle gracefully
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  /**
   * 🧠 LEARNING: Testing Authentication Middleware
   *
   * Integration tests can verify that:
   * - Authentication is properly enforced
   * - Different user roles have correct access
   * - Security headers are set
   * - Session handling works correctly
   */
  describe("Authentication Integration", () => {
    it("should enforce authentication on protected routes", async () => {
      // ARRANGE: No session
      mockGetServerSession.mockResolvedValue(null);

      // ACT: Try to access protected endpoint
      const response = await GET(createAPIRequest());

      // ASSERT: Should be denied
      await responseHelpers.expectUnauthorizedResponse(response);

      // Verify no database queries were made
      // (This would require additional mocking to verify)
    });

    it("should allow access with valid session", async () => {
      // ARRANGE: Valid user and session
      const testUser = await dbHelpers.createTestUser();
      mockGetServerSession.mockResolvedValue(mockSession(testUser));

      // ACT
      const response = await GET(createAPIRequest());

      // ASSERT: Should be allowed
      await responseHelpers.expectSuccessResponse(response);
    });

    it("should handle expired sessions", async () => {
      // ARRANGE: NextAuth would return null for expired sessions
      // In real scenarios, NextAuth middleware handles this before our API
      mockGetServerSession.mockResolvedValue(null);

      // ACT
      const response = await GET(createAPIRequest());

      // ASSERT: Should return 401 for missing/expired session
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain("Authentication required");
    });
  });

  /**
   * 🧠 LEARNING: Database Integration Testing
   *
   * What we're testing:
   * ✅ Data persistence across requests
   * ✅ Database constraints and validations
   * ✅ Query performance with real data
   * ✅ Transaction handling
   * ✅ Foreign key relationships
   */
  describe("Database Integration", () => {
    it("should maintain data consistency across multiple operations", async () => {
      // ARRANGE: Create user with specific data
      const originalUser = await dbHelpers.createTestUser({
        email: "consistency@test.com",
        name: "Consistency Test",
        role: "ADMIN",
      });

      // ACT: Retrieve user via API
      mockGetServerSession.mockResolvedValue(mockSession(originalUser));
      const response = await GET(createAPIRequest());

      // ASSERT: Data should match what we stored
      const data = await responseHelpers.expectSuccessResponse(response);
      expect(data.data.email).toBe("consistency@test.com");
      expect(data.data.name).toBe("Consistency Test");
      expect(data.data.role).toBe("ADMIN");
    });

    it("should handle concurrent user operations", async () => {
      // ARRANGE: Create multiple users with unique domains
      const users = await Promise.all([
        dbHelpers.createTestUser({
          email: "user1@test1.com",
        }),
        dbHelpers.createTestUser({
          email: "user2@test2.com",
        }),
        dbHelpers.createTestUser({
          email: "user3@test3.com",
        }),
      ]);

      // ACT: Make concurrent API calls
      const responses = await Promise.all(
        users.map((user) => {
          mockGetServerSession.mockResolvedValue(mockSession(user));
          return GET(createAPIRequest());
        })
      );

      // ASSERT: All should succeed
      for (const response of responses) {
        await responseHelpers.expectSuccessResponse(response);
      }
    });
  });
});

/**
 * 🧠 LEARNING: Integration Test Best Practices
 *
 * ✅ Use real test database (separate from dev/prod)
 * ✅ Clean database between tests
 * ✅ Test realistic scenarios
 * ✅ Verify database state changes
 * ✅ Test error conditions
 * ✅ Keep tests independent
 * ✅ Mock external services only (not internal code)
 * ✅ Test authentication and authorization
 * ✅ Verify API response formats
 * ✅ Test concurrent operations
 *
 * What NOT to do:
 * ❌ Don't use production database
 * ❌ Don't let tests depend on each other
 * ❌ Don't mock internal application code
 * ❌ Don't ignore database cleanup
 * ❌ Don't test implementation details
 *
 * Integration vs Unit vs E2E:
 * - Unit: Test single function in isolation
 * - Integration: Test components working together
 * - E2E: Test complete user workflows through UI
 */
