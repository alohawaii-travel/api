import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateApiAccess } from "@/middleware/apiAuth";
import { validateAdminAuth } from "@/lib/admin-auth";
import { UserRole } from "@/types/database";

export async function GET(request: NextRequest) {
  try {
    // First validate API access for internal routes
    const apiValidation = validateApiAccess(request, "internal");
    if (!apiValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: apiValidation.error,
          code: "UNAUTHORIZED_API",
        },
        { status: 401 }
      );
    }

    // Then validate admin permissions
    const adminValidation = await validateAdminAuth(request);
    if (!adminValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: adminValidation.error,
          code: "INSUFFICIENT_PERMISSIONS",
        },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100); // Max 100 users per page
    const role = searchParams.get("role") as UserRole | null;
    const search = searchParams.get("search");
    const isActive = searchParams.get("isActive");

    // Build where clause
    const where: any = {};

    const validRoles = ["CUSTOMER", "STAFF", "MANAGER", "ADMIN", "SUPER_ADMIN"];
    if (role && validRoles.includes(role)) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isActive !== null) {
      where.isActive = isActive === "true";
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch users with pagination
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
          domain: true,
          isActive: true,
          language: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
        },
        orderBy: [{ role: "asc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage,
          hasPreviousPage,
        },
      },
      message: `Retrieved ${users.length} users successfully`,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch users. Please try again later.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
