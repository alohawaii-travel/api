import { NextRequest } from "next/server";
import { GET } from "@/app/api/internal/users/route";
import { validateApiAccess } from "@/middleware/apiAuth";
import { validateAdminAuth } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@/types/database";

// Mock the dependencies
jest.mock("@/middleware/apiAuth");
jest.mock("@/lib/admin-auth");
jest.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

const mockValidateApiAccess = validateApiAccess as jest.MockedFunction<
  typeof validateApiAccess
>;
const mockValidateAdminAuth = validateAdminAuth as jest.MockedFunction<
  typeof validateAdminAuth
>;
const mockPrismaUserFindMany = prisma.user.findMany as jest.MockedFunction<
  typeof prisma.user.findMany
>;
const mockPrismaUserCount = prisma.user.count as jest.MockedFunction<
  typeof prisma.user.count
>;

describe("/api/internal/users - GET", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 if API access validation fails", async () => {
    const request = new NextRequest("http://localhost:4000/api/internal/users");

    mockValidateApiAccess.mockReturnValue({
      isValid: false,
      error: "Invalid API key",
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.code).toBe("UNAUTHORIZED_API");
  });

  it("should return 403 if user lacks admin permissions", async () => {
    const request = new NextRequest("http://localhost:4000/api/internal/users");

    mockValidateApiAccess.mockReturnValue({ isValid: true });
    mockValidateAdminAuth.mockResolvedValue({
      isValid: false,
      error: "Admin permissions required",
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.code).toBe("INSUFFICIENT_PERMISSIONS");
  });

  it("should return users successfully with default pagination", async () => {
    const request = new NextRequest("http://localhost:4000/api/internal/users");
    const mockUsers = [
      {
        id: "user1",
        email: "admin@example.com",
        name: "Admin User",
        avatar: null,
        role: "ADMIN" as UserRole,
        domain: "example.com",
        isActive: true,
        language: "en",
        googleId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
      },
      {
        id: "user2",
        email: "staff@example.com",
        name: "Staff User",
        avatar: null,
        role: "STAFF" as UserRole,
        domain: "example.com",
        isActive: true,
        language: "en",
        googleId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      },
    ];

    mockValidateApiAccess.mockReturnValue({ isValid: true });
    mockValidateAdminAuth.mockResolvedValue({
      isValid: true,
      user: {
        id: "admin1",
        role: "ADMIN" as UserRole,
        email: "admin@example.com",
      },
    });
    mockPrismaUserFindMany.mockResolvedValue(mockUsers);
    mockPrismaUserCount.mockResolvedValue(2);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.users).toHaveLength(2);
    expect(data.data.pagination.totalCount).toBe(2);
    expect(data.data.pagination.currentPage).toBe(1);
    expect(data.data.pagination.limit).toBe(50);
  });

  it("should handle pagination parameters correctly", async () => {
    const request = new NextRequest(
      "http://localhost:4000/api/internal/users?page=2&limit=10"
    );

    mockValidateApiAccess.mockReturnValue({ isValid: true });
    mockValidateAdminAuth.mockResolvedValue({
      isValid: true,
      user: {
        id: "admin1",
        role: "ADMIN" as UserRole,
        email: "admin@example.com",
      },
    });
    mockPrismaUserFindMany.mockResolvedValue([]);
    mockPrismaUserCount.mockResolvedValue(25);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockPrismaUserFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10, // (page 2 - 1) * limit 10
        take: 10,
      })
    );
    expect(data.data.pagination.currentPage).toBe(2);
    expect(data.data.pagination.totalPages).toBe(3); // 25 users / 10 per page
  });

  it("should filter by role when specified", async () => {
    const request = new NextRequest(
      "http://localhost:4000/api/internal/users?role=STAFF"
    );

    mockValidateApiAccess.mockReturnValue({ isValid: true });
    mockValidateAdminAuth.mockResolvedValue({
      isValid: true,
      user: {
        id: "admin1",
        role: "ADMIN" as UserRole,
        email: "admin@example.com",
      },
    });
    mockPrismaUserFindMany.mockResolvedValue([]);
    mockPrismaUserCount.mockResolvedValue(0);

    await GET(request);

    expect(mockPrismaUserFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { role: "STAFF" as UserRole },
      })
    );
  });

  it("should handle search parameter", async () => {
    const request = new NextRequest(
      "http://localhost:4000/api/internal/users?search=john"
    );

    mockValidateApiAccess.mockReturnValue({ isValid: true });
    mockValidateAdminAuth.mockResolvedValue({
      isValid: true,
      user: {
        id: "admin1",
        role: "ADMIN" as UserRole,
        email: "admin@example.com",
      },
    });
    mockPrismaUserFindMany.mockResolvedValue([]);
    mockPrismaUserCount.mockResolvedValue(0);

    await GET(request);

    expect(mockPrismaUserFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { email: { contains: "john", mode: "insensitive" } },
            { name: { contains: "john", mode: "insensitive" } },
          ],
        },
      })
    );
  });

  it("should enforce maximum limit of 100", async () => {
    const request = new NextRequest(
      "http://localhost:4000/api/internal/users?limit=200"
    );

    mockValidateApiAccess.mockReturnValue({ isValid: true });
    mockValidateAdminAuth.mockResolvedValue({
      isValid: true,
      user: {
        id: "admin1",
        role: "ADMIN" as UserRole,
        email: "admin@example.com",
      },
    });
    mockPrismaUserFindMany.mockResolvedValue([]);
    mockPrismaUserCount.mockResolvedValue(0);

    const response = await GET(request);
    const data = await response.json();

    expect(mockPrismaUserFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 100, // Should be capped at 100
      })
    );
    expect(data.data.pagination.limit).toBe(100);
  });

  it("should handle database errors gracefully", async () => {
    const request = new NextRequest("http://localhost:4000/api/internal/users");

    mockValidateApiAccess.mockReturnValue({ isValid: true });
    mockValidateAdminAuth.mockResolvedValue({
      isValid: true,
      user: {
        id: "admin1",
        role: "ADMIN" as UserRole,
        email: "admin@example.com",
      },
    });
    mockPrismaUserFindMany.mockRejectedValue(
      new Error("Database connection failed")
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.code).toBe("INTERNAL_ERROR");
  });
});
