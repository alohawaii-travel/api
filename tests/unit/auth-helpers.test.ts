/**
 * Unit Tests for Authentication Helpers
 *
 * 🧠 LEARNING: Testing Business Logic
 *
 * What are we testing here?
 * ✅ Domain validation logic
 * ✅ User role permissions
 * ✅ API response formatting
 * ✅ Error handling
 *
 * Why unit test these functions?
 * - They contain critical business logic
 * - They're pure functions (same input = same output)
 * - Easy to test in isolation
 * - Fast execution
 * - Critical for security (domain whitelisting)
 */

import {
  isEmailFromWhitelistedDomain,
  createApiResponse,
  hasPermission,
} from "@/lib/api-helpers";
import {
  mockUserFactory,
  mockWhitelistedDomainFactory,
} from "../helpers/test-utils";

// Mock Prisma for unit tests
jest.mock("@/lib/db", () => ({
  prisma: {
    whitelistedDomain: {
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";

describe("Authentication Helpers Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("isEmailFromWhitelistedDomain", () => {
    it("should return true for whitelisted domain", async () => {
      // ARRANGE: Mock database to return a domain
      const mockDomain = mockWhitelistedDomainFactory({
        domain: "testcompany.com",
      });
      (prisma.whitelistedDomain.findUnique as jest.Mock).mockResolvedValue(
        mockDomain
      );

      // ACT: Test the function
      const result = await isEmailFromWhitelistedDomain("john@testcompany.com");

      // ASSERT: Verify result and database query
      expect(result).toBe(true);
      expect(prisma.whitelistedDomain.findUnique).toHaveBeenCalledWith({
        where: { domain: "testcompany.com" },
      });
    });

    it("should return false for non-whitelisted domain", async () => {
      // ARRANGE: Mock database to return null (domain not found)
      (prisma.whitelistedDomain.findUnique as jest.Mock).mockResolvedValue(
        null
      );

      // ACT
      const result = await isEmailFromWhitelistedDomain("john@badcompany.com");

      // ASSERT
      expect(result).toBe(false);
      expect(prisma.whitelistedDomain.findUnique).toHaveBeenCalledWith({
        where: { domain: "badcompany.com" },
      });
    });

    it("should extract domain correctly from complex email", async () => {
      // ARRANGE
      (prisma.whitelistedDomain.findUnique as jest.Mock).mockResolvedValue(
        null
      );

      // ACT: Test with complex email format
      await isEmailFromWhitelistedDomain("first.last+tag@sub.example.com");

      // ASSERT: Verify correct domain extraction
      expect(prisma.whitelistedDomain.findUnique).toHaveBeenCalledWith({
        where: { domain: "sub.example.com" },
      });
    });

    it("should handle invalid email format gracefully", async () => {
      // ACT: Test with invalid email
      const result = await isEmailFromWhitelistedDomain("invalid-email");

      // ASSERT: Should return false and not crash
      expect(result).toBe(false);
      expect(prisma.whitelistedDomain.findUnique).not.toHaveBeenCalled();
    });

    it("should handle database errors gracefully", async () => {
      // ARRANGE: Mock database to throw error
      (prisma.whitelistedDomain.findUnique as jest.Mock).mockRejectedValue(
        new Error("Database connection failed")
      );

      // ACT & ASSERT: Should not throw, should return false
      await expect(isEmailFromWhitelistedDomain("john@test.com")).resolves.toBe(
        false
      );
    });
  });

  describe("createApiResponse", () => {
    it("should create success response with data", () => {
      // ARRANGE
      const testData = { userId: "123", name: "John" };

      // ACT
      const response = createApiResponse(true, "User found", testData);

      // ASSERT
      expect(response).toEqual({
        success: true,
        message: "User found",
        data: testData,
      });
    });

    it("should create error response without data", () => {
      // ACT
      const response = createApiResponse(false, "User not found");

      // ASSERT
      expect(response).toEqual({
        success: false,
        message: "User not found",
        data: undefined,
      });
    });

    it("should handle null data explicitly", () => {
      // ACT
      const response = createApiResponse(true, "Success", null);

      // ASSERT
      expect(response).toEqual({
        success: true,
        message: "Success",
        data: null,
      });
    });

    it("should handle complex nested data", () => {
      // ARRANGE
      const complexData = {
        user: mockUserFactory(),
        permissions: ["read", "write"],
        metadata: { loginTime: new Date() },
      };

      // ACT
      const response = createApiResponse(true, "Complex data", complexData);

      // ASSERT
      expect(response.success).toBe(true);
      expect(response.data).toEqual(complexData);
      expect(response.data.user.email).toBe("john.doe@testcompany.com");
    });
  });

  describe("hasPermission", () => {
    it("should allow SUPER_ADMIN to access everything", () => {
      // ARRANGE
      const superAdmin = mockUserFactory({ role: "SUPER_ADMIN" });

      // ACT & ASSERT
      expect(hasPermission(superAdmin, "admin")).toBe(true);
      expect(hasPermission(superAdmin, "customer")).toBe(true);
      expect(hasPermission(superAdmin, "super_admin")).toBe(true);
    });

    it("should allow ADMIN to access admin and customer resources", () => {
      // ARRANGE
      const admin = mockUserFactory({ role: "ADMIN" });

      // ACT & ASSERT
      expect(hasPermission(admin, "admin")).toBe(true);
      expect(hasPermission(admin, "customer")).toBe(true);
      expect(hasPermission(admin, "super_admin")).toBe(false);
    });

    it("should allow CUSTOMER to access only customer resources", () => {
      // ARRANGE
      const customer = mockUserFactory({ role: "CUSTOMER" });

      // ACT & ASSERT
      expect(hasPermission(customer, "customer")).toBe(true);
      expect(hasPermission(customer, "admin")).toBe(false);
      expect(hasPermission(customer, "super_admin")).toBe(false);
    });

    it("should handle undefined user gracefully", () => {
      // ACT & ASSERT
      expect(hasPermission(undefined, "customer")).toBe(false);
      expect(hasPermission(null as any, "admin")).toBe(false);
    });

    it("should handle invalid permission level", () => {
      // ARRANGE
      const user = mockUserFactory();

      // ACT & ASSERT
      expect(hasPermission(user, "invalid_permission" as any)).toBe(false);
    });

    it("should be case sensitive for permission levels", () => {
      // ARRANGE
      const admin = mockUserFactory({ role: "ADMIN" });

      // ACT & ASSERT
      expect(hasPermission(admin, "ADMIN" as any)).toBe(false); // Should be lowercase
      expect(hasPermission(admin, "admin")).toBe(true);
    });
  });
});

/**
 * 🧠 LEARNING: What Makes a Good Unit Test?
 *
 * ✅ FAST: Runs in milliseconds
 * ✅ ISOLATED: No external dependencies
 * ✅ REPEATABLE: Same result every time
 * ✅ SELF-VALIDATING: Clear pass/fail
 * ✅ TIMELY: Written with or before the code
 *
 * Test Organization:
 * - Group related tests with describe()
 * - Use descriptive test names
 * - Follow AAA pattern (Arrange, Act, Assert)
 * - Test happy path and edge cases
 * - Test error conditions
 *
 * Common Patterns Tested:
 * ✅ Valid inputs return expected outputs
 * ✅ Invalid inputs are handled gracefully
 * ✅ Edge cases (null, undefined, empty)
 * ✅ Error conditions don't crash
 * ✅ External dependencies are mocked
 * ✅ Business logic is correct
 */
