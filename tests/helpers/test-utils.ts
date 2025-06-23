/**
 * Test Utilities and Helpers
 *
 * 🧠 LEARNING: Why create test utilities?
 *
 * ✅ DRY Principle: Don't Repeat Yourself in tests
 * ✅ Consistency: Same patterns across all tests
 * ✅ Maintainability: Change once, fix everywhere
 * ✅ Readability: Tests focus on what they're testing, not setup
 * ✅ Reusability: Common patterns available to all tests
 *
 * Common utilities include:
 * - Mock data factories
 * - Database helpers
 * - Authentication helpers
 * - HTTP request helpers
 */

import { NextRequest } from "next/server";
import { User, WhitelistedDomain } from "@prisma/client";

/**
 * 🧠 LEARNING: Mock Data Factories
 *
 * What are factories?
 * - Functions that create consistent test data
 * - Can be customized with specific values
 * - Generate realistic but fake data
 * - Prevent tests from being brittle (hard-coded values)
 *
 * Why use factories instead of hard-coded data?
 * ✅ Easy to modify all tests at once
 * ✅ Can create variations of data easily
 * ✅ Tests are more readable and focused
 * ✅ Reduces typos in test data
 */

export const mockUserFactory = (overrides?: Partial<User>): User => ({
  id: "user-123",
  email: "john.doe@testcompany.com",
  name: "John Doe",
  image: "https://example.com/avatar.jpg",
  role: "CUSTOMER",
  emailVerified: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const mockAdminUserFactory = (overrides?: Partial<User>): User =>
  mockUserFactory({
    id: "admin-456",
    email: "admin@testcompany.com",
    name: "Admin User",
    role: "ADMIN",
    ...overrides,
  });

export const mockSuperAdminUserFactory = (overrides?: Partial<User>): User =>
  mockUserFactory({
    id: "superadmin-789",
    email: "superadmin@testcompany.com",
    name: "Super Admin",
    role: "SUPER_ADMIN",
    ...overrides,
  });

export const mockWhitelistedDomainFactory = (
  overrides?: Partial<WhitelistedDomain>
): WhitelistedDomain => ({
  id: "domain-123",
  domain: "testcompany.com",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * 🧠 LEARNING: HTTP Request Helpers
 *
 * Why create request helpers?
 * - NextJS API routes expect NextRequest objects
 * - Consistent way to create test requests
 * - Easy to add headers, body, query params
 * - Simulate different HTTP methods
 */

export const createMockRequest = (
  url: string = "http://localhost:4000/api/test",
  options: RequestInit = {}
): NextRequest => {
  return new NextRequest(url, {
    method: "GET",
    ...options,
  });
};

export const createMockPOSTRequest = (
  url: string,
  body: any,
  headers: Record<string, string> = {}
): NextRequest => {
  return new NextRequest(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
};

/**
 * 🧠 LEARNING: Session Mocking Helpers
 *
 * Why mock authentication?
 * - Tests need to run without real login
 * - Test different user roles and permissions
 * - Test unauthorized access scenarios
 * - Fast test execution (no OAuth roundtrip)
 */

export const mockSession = (user?: Partial<User>) => ({
  user: mockUserFactory(user),
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
});

export const mockAdminSession = () => mockSession(mockAdminUserFactory());
export const mockSuperAdminSession = () =>
  mockSession(mockSuperAdminUserFactory());

/**
 * 🧠 LEARNING: Database Testing Helpers
 *
 * These help with integration tests that use real database
 * - Clean database between tests
 * - Create test data
 * - Verify database state
 */

export const dbHelpers = {
  /**
   * Clean all tables - use in beforeEach for integration tests
   */
  async cleanDatabase() {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    try {
      // 🧠 LEARNING: Delete in correct order to avoid foreign key constraints
      await prisma.account.deleteMany();
      await prisma.session.deleteMany();
      await prisma.user.deleteMany();
      await prisma.whitelistedDomain.deleteMany();
    } finally {
      await prisma.$disconnect();
    }
  },

  /**
   * Create test user with whitelisted domain
   */
  async createTestUser(userData?: Partial<User>) {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    try {
      const user = mockUserFactory(userData);

      // Create whitelisted domain first
      await prisma.whitelistedDomain.create({
        data: mockWhitelistedDomainFactory({
          domain: user.email.split("@")[1],
        }),
      });

      // Create user
      return await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          emailVerified: user.emailVerified,
        },
      });
    } finally {
      await prisma.$disconnect();
    }
  },
};

/**
 * 🧠 LEARNING: API Response Helpers
 *
 * Consistent way to test API responses
 * - Test success/error patterns
 * - Verify response structure
 * - Extract data from responses
 */

export const responseHelpers = {
  async expectSuccessResponse(response: Response, expectedData?: any) {
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    if (expectedData) {
      expect(data.data).toEqual(expectedData);
    }
    return data;
  },

  async expectErrorResponse(
    response: Response,
    expectedStatus: number,
    expectedMessage?: string
  ) {
    expect(response.status).toBe(expectedStatus);
    const data = await response.json();
    expect(data.success).toBe(false);
    if (expectedMessage) {
      expect(data.message).toContain(expectedMessage);
    }
    return data;
  },

  async expectUnauthorizedResponse(response: Response) {
    return this.expectErrorResponse(response, 401, "Unauthorized");
  },

  async expectForbiddenResponse(response: Response) {
    return this.expectErrorResponse(response, 403, "Forbidden");
  },
};

/**
 * 🧠 LEARNING: Environment Helpers
 *
 * Safely manage environment variables in tests
 * - Save original values
 * - Restore after tests
 * - Set test-specific values
 */

export const envHelpers = {
  originalEnv: {} as Record<string, string | undefined>,

  /**
   * Save current environment and set test values
   */
  setTestEnv(testEnv: Record<string, string>) {
    Object.keys(testEnv).forEach((key) => {
      this.originalEnv[key] = process.env[key];
      process.env[key] = testEnv[key];
    });
  },

  /**
   * Restore original environment values
   */
  restoreEnv() {
    Object.keys(this.originalEnv).forEach((key) => {
      if (this.originalEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = this.originalEnv[key];
      }
    });
    this.originalEnv = {};
  },
};

/**
 * 🧠 LEARNING: Test Assertions
 *
 * Custom assertions for common patterns
 * - More readable test code
 * - Consistent error messages
 * - Domain-specific validations
 */

export const customMatchers = {
  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      message: () => `Expected ${received} to be a valid email`,
      pass: emailRegex.test(received),
    };
  },

  toBeValidUUID(received: string) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return {
      message: () => `Expected ${received} to be a valid UUID`,
      pass: uuidRegex.test(received),
    };
  },

  toHaveApiStructure(received: any) {
    const hasStructure =
      typeof received === "object" &&
      typeof received.success === "boolean" &&
      typeof received.message === "string" &&
      received.hasOwnProperty("data");

    return {
      message: () =>
        `Expected object to have API structure: { success, message, data }`,
      pass: hasStructure,
    };
  },
};
