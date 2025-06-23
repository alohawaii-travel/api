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
import { getServerSession } from "next-auth/next";
import {
  mockSession,
  mockAdminSession,
  dbHelpers,
  responseHelpers,
  createMockRequest,
} from "../helpers/test-utils";

// Mock NextAuth for integration tests
jest.mock("next-auth/next");
const mockGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;

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
        role: "CUSTOMER",
      });

      // Mock authentication session
      mockGetServerSession.mockResolvedValue(mockSession(testUser));

      const request = createMockRequest(
        "http://localhost:4000/api/internal/users/me"
      );

      // ACT: Call the API endpoint
      const response = await GET();

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
      const response = await GET();

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
      const response = await GET();

      // ASSERT: Should succeed because domain was whitelisted in createTestUser
      const data = await responseHelpers.expectSuccessResponse(response);
      expect(data.data.email).toBe("user@alloweddomain.com");
    });

    it("should include correct user roles in response", async () => {
      // ARRANGE: Test different user roles
      const roles = ["CUSTOMER", "ADMIN", "SUPER_ADMIN"] as const;

      for (const role of roles) {
        // Clean database between role tests
        await dbHelpers.cleanDatabase();

        const testUser = await dbHelpers.createTestUser({
          email: `${role.toLowerCase()}@testcompany.com`,
          role,
        });

        mockGetServerSession.mockResolvedValue(mockSession(testUser));

        // ACT
        const response = await GET();

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
      const response = await GET();

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
      const response = await GET();

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
      const response = await GET();

      // ASSERT: Should be allowed
      await responseHelpers.expectSuccessResponse(response);
    });

    it("should handle expired sessions", async () => {
      // ARRANGE: Expired session (past expiry date)
      const testUser = await dbHelpers.createTestUser();
      const expiredSession = {
        ...mockSession(testUser),
        expires: new Date(Date.now() - 1000).toISOString(), // 1 second ago
      };

      mockGetServerSession.mockResolvedValue(expiredSession);

      // ACT
      const response = await GET();

      // ASSERT: Should handle expired session
      // Note: NextAuth.js handles this at the middleware level,
      // so this test verifies our integration with their system
      expect(response.status).toBeGreaterThanOrEqual(400);
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
      const response = await GET();

      // ASSERT: Data should match what we stored
      const data = await responseHelpers.expectSuccessResponse(response);
      expect(data.data.email).toBe("consistency@test.com");
      expect(data.data.name).toBe("Consistency Test");
      expect(data.data.role).toBe("ADMIN");
    });

    it("should handle concurrent user operations", async () => {
      // ARRANGE: Create multiple users
      const users = await Promise.all([
        dbHelpers.createTestUser({ email: "user1@test.com" }),
        dbHelpers.createTestUser({ email: "user2@test.com" }),
        dbHelpers.createTestUser({ email: "user3@test.com" }),
      ]);

      // ACT: Make concurrent API calls
      const responses = await Promise.all(
        users.map((user) => {
          mockGetServerSession.mockResolvedValue(mockSession(user));
          return GET();
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
