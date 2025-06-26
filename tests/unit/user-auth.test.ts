/**
 * Unit Tests for User Authentication Endpoint
 *
 * 🧠 LEARNING: What are we testing?
 *
 * The /api/internal/users/auth endpoint handles:
 * ✅ API key validation
 * ✅ Domain whitelisting
 * ✅ User creation and status checks
 * ✅ Role-based access control
 * ✅ Error handling for various scenarios
 */

import { NextRequest } from "next/server";
import { POST } from "@/app/api/internal/users/auth/route";
import { validateApiAccess } from "@/middleware/apiAuth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import {
  mockUserFactory,
  mockWhitelistedDomainFactory,
  createMockPOSTRequest,
} from "../helpers/test-utils";

// Mock external dependencies
jest.mock("@/middleware/apiAuth");
jest.mock("@/lib/db", () => ({
  prisma: {
    whitelistedDomain: {
      findFirst: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const mockValidateApiAccess = validateApiAccess as jest.MockedFunction<
  typeof validateApiAccess
>;
const mockPrismaWhitelistedDomainFindFirst = prisma.whitelistedDomain
  .findFirst as jest.MockedFunction<typeof prisma.whitelistedDomain.findFirst>;
const mockPrismaUserFindUnique = prisma.user.findUnique as jest.MockedFunction<
  typeof prisma.user.findUnique
>;
const mockPrismaUserCreate = prisma.user.create as jest.MockedFunction<
  typeof prisma.user.create
>;
const mockPrismaUserUpdate = prisma.user.update as jest.MockedFunction<
  typeof prisma.user.update
>;

describe("User Authentication Endpoint Unit Tests", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Default mock for API access validation (success)
    mockValidateApiAccess.mockReturnValue({
      isValid: true,
      apiKey: "hub-api-key-test",
    });
  });

  describe("API Key Validation", () => {
    it("should reject requests with invalid API key", async () => {
      // ARRANGE: Mock invalid API key
      mockValidateApiAccess.mockReturnValue({
        isValid: false,
        error: "Invalid API key provided.",
      });

      const request = createMockPOSTRequest(
        "/api/internal/users/auth",
        {
          email: "test@gmail.com",
          name: "Test User",
          provider: "google",
        },
        {
          "X-API-Key": "invalid-key",
        }
      );

      // ACT: Call the endpoint
      const response = await POST(request);
      const data = await response.json();

      // ASSERT: Should reject with 401
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid API key provided.");
    });

    it("should accept requests with valid API key", async () => {
      // ARRANGE: Mock valid API key and successful domain/user lookup
      mockPrismaWhitelistedDomainFindFirst.mockResolvedValue(
        mockWhitelistedDomainFactory({ domain: "gmail.com" })
      );
      mockPrismaUserFindUnique.mockResolvedValue(null); // New user
      mockPrismaUserCreate.mockResolvedValue(
        mockUserFactory({ email: "test@gmail.com", role: UserRole.PENDING })
      );

      const request = createMockPOSTRequest(
        "/api/internal/users/auth",
        {
          email: "test@gmail.com",
          name: "Test User",
          provider: "google",
        },
        {
          "X-API-Key": "hub-api-key-test",
        }
      );

      // ACT: Call the endpoint
      const response = await POST(request);

      // ASSERT: Should process the request (not reject for API key)
      expect(mockValidateApiAccess).toHaveBeenCalledWith(request, "internal");
      expect(response.status).not.toBe(401);
    });
  });

  describe("Input Validation", () => {
    it("should reject requests without email", async () => {
      // ARRANGE: Request without email
      const request = createMockPOSTRequest("/api/internal/users/auth", {
        name: "Test User",
        provider: "google",
      });

      // ACT: Call the endpoint
      const response = await POST(request);
      const data = await response.json();

      // ASSERT: Should reject with 400
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Email is required");
    });
  });

  describe("Domain Whitelisting", () => {
    it("should reject non-whitelisted domains", async () => {
      // ARRANGE: Mock non-whitelisted domain
      mockPrismaWhitelistedDomainFindFirst.mockResolvedValue(null);

      const request = createMockPOSTRequest("/api/internal/users/auth", {
        email: "test@blacklisted.com",
        name: "Test User",
        provider: "google",
      });

      // ACT: Call the endpoint
      const response = await POST(request);
      const data = await response.json();

      // ASSERT: Should reject with 403
      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Domain not authorized for this system");
      expect(data.statusCode).toBe(403);
    });

    it("should accept whitelisted domains", async () => {
      // ARRANGE: Mock whitelisted domain and new user
      mockPrismaWhitelistedDomainFindFirst.mockResolvedValue(
        mockWhitelistedDomainFactory({ domain: "company.com", isActive: true })
      );
      mockPrismaUserFindUnique.mockResolvedValue(null);
      mockPrismaUserCreate.mockResolvedValue(
        mockUserFactory({ email: "test@company.com", role: UserRole.PENDING })
      );

      const request = createMockPOSTRequest("/api/internal/users/auth", {
        email: "test@company.com",
        name: "Test User",
        provider: "google",
      });

      // ACT: Call the endpoint
      const response = await POST(request);
      const data = await response.json();

      // ASSERT: Should accept the domain and create user but reject access due to PENDING role
      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe(
        "Account created but requires administrator approval. Please contact your administrator for access."
      );
      expect(data.statusCode).toBe(403);

      // Should call user lookup and creation methods
      expect(mockPrismaUserFindUnique).toHaveBeenCalledWith({
        where: { email: "test@company.com" },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
        },
      });

      expect(mockPrismaUserCreate).toHaveBeenCalledWith({
        data: {
          email: "test@company.com",
          name: "Test User",
          image: null,
          role: UserRole.PENDING,
          lastLoginAt: expect.any(Date),
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      });
    });
  });

  describe("Existing User Authentication", () => {
    it("should reject inactive users", async () => {
      // ARRANGE: Mock whitelisted domain and inactive user
      mockPrismaWhitelistedDomainFindFirst.mockResolvedValue(
        mockWhitelistedDomainFactory({ domain: "gmail.com" })
      );
      mockPrismaUserFindUnique.mockResolvedValue(
        mockUserFactory({
          email: "inactive@gmail.com",
          isActive: false,
          role: UserRole.USER,
        })
      );

      const request = createMockPOSTRequest("/api/internal/users/auth", {
        email: "inactive@gmail.com",
        name: "Inactive User",
        provider: "google",
      });

      // ACT: Call the endpoint
      const response = await POST(request);
      const data = await response.json();

      // ASSERT: Should reject with 403
      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe(
        "Account is deactivated. Please contact administrator."
      );
      expect(data.statusCode).toBe(403);
    });

    it("should reject users with PENDING role", async () => {
      // ARRANGE: Mock whitelisted domain and pending user
      mockPrismaWhitelistedDomainFindFirst.mockResolvedValue(
        mockWhitelistedDomainFactory({ domain: "gmail.com" })
      );
      mockPrismaUserFindUnique.mockResolvedValue(
        mockUserFactory({
          email: "pending@gmail.com",
          role: UserRole.PENDING,
          isActive: true,
        })
      );

      const request = createMockPOSTRequest("/api/internal/users/auth", {
        email: "pending@gmail.com",
        name: "Pending User",
        provider: "google",
      });

      // ACT: Call the endpoint
      const response = await POST(request);
      const data = await response.json();

      // ASSERT: Should reject with 403
      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe(
        "Account is pending approval. Please contact administrator for access."
      );
      expect(data.statusCode).toBe(403);
    });

    it("should authenticate active users with valid roles", async () => {
      // ARRANGE: Mock whitelisted domain and active user
      const existingUser = mockUserFactory({
        email: "active@gmail.com",
        role: UserRole.ADMIN,
        isActive: true,
      });

      mockPrismaWhitelistedDomainFindFirst.mockResolvedValue(
        mockWhitelistedDomainFactory({ domain: "gmail.com" })
      );
      mockPrismaUserFindUnique.mockResolvedValue(existingUser);
      mockPrismaUserUpdate.mockResolvedValue({
        ...existingUser,
        lastLoginAt: new Date(),
      });

      const request = createMockPOSTRequest("/api/internal/users/auth", {
        email: "active@gmail.com",
        name: "Active User",
        provider: "google",
      });

      // ACT: Call the endpoint
      const response = await POST(request);
      const data = await response.json();

      // ASSERT: Should authenticate successfully
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.user?.email).toBe("active@gmail.com");
      expect(data.user?.role).toBe(UserRole.ADMIN);
      expect(data.user?.isActive).toBe(true);

      // Should update last login time
      expect(mockPrismaUserUpdate).toHaveBeenCalledWith({
        where: { email: "active@gmail.com" },
        data: {
          lastLoginAt: expect.any(Date),
          name: "Active User",
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      });
    });
  });

  describe("New User Registration", () => {
    it("should create new users with PENDING role", async () => {
      // ARRANGE: Mock whitelisted domain and no existing user
      mockPrismaWhitelistedDomainFindFirst.mockResolvedValue(
        mockWhitelistedDomainFactory({ domain: "gmail.com" })
      );
      mockPrismaUserFindUnique.mockResolvedValue(null);

      const newUser = mockUserFactory({
        email: "newuser@gmail.com",
        role: UserRole.PENDING,
      });
      mockPrismaUserCreate.mockResolvedValue(newUser);

      const request = createMockPOSTRequest("/api/internal/users/auth", {
        email: "newuser@gmail.com",
        name: "New User",
        provider: "google",
      });

      // ACT: Call the endpoint
      const response = await POST(request);
      const data = await response.json();

      // ASSERT: Should create user but reject access
      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe(
        "Account created but requires administrator approval. Please contact your administrator for access."
      );
      expect(data.statusCode).toBe(403);

      // Should create user with PENDING role
      expect(mockPrismaUserCreate).toHaveBeenCalledWith({
        data: {
          email: "newuser@gmail.com",
          name: "New User",
          image: null,
          role: UserRole.PENDING,
          lastLoginAt: expect.any(Date),
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      // ARRANGE: Mock database error
      mockPrismaWhitelistedDomainFindFirst.mockRejectedValue(
        new Error("Database connection failed")
      );

      const request = createMockPOSTRequest("/api/internal/users/auth", {
        email: "test@gmail.com",
        name: "Test User",
        provider: "google",
      });

      // ACT: Call the endpoint
      const response = await POST(request);
      const data = await response.json();

      // ASSERT: Should return 500 error
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Authentication service unavailable");
    });
  });

  describe("Role-based Authentication Scenarios", () => {
    const roles = [
      UserRole.USER,
      UserRole.STAFF,
      UserRole.MANAGER,
      UserRole.ADMIN,
    ];

    roles.forEach((role) => {
      it(`should authenticate active ${role} users successfully`, async () => {
        // ARRANGE: Mock user with specific role
        const user = mockUserFactory({
          email: `${role.toLowerCase()}@gmail.com`,
          role,
          isActive: true,
        });

        mockPrismaWhitelistedDomainFindFirst.mockResolvedValue(
          mockWhitelistedDomainFactory({ domain: "gmail.com" })
        );
        mockPrismaUserFindUnique.mockResolvedValue(user);
        mockPrismaUserUpdate.mockResolvedValue({
          ...user,
          lastLoginAt: new Date(),
        });

        const request = createMockPOSTRequest("/api/internal/users/auth", {
          email: `${role.toLowerCase()}@gmail.com`,
          name: `${role} User`,
          provider: "google",
        });

        // ACT: Call the endpoint
        const response = await POST(request);
        const data = await response.json();

        // ASSERT: Should authenticate successfully
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.user?.role).toBe(role);
      });
    });
  });
});
