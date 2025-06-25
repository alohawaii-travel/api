import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateApiAccess } from "@/middleware/apiAuth";
import { validateAdminAuth } from "@/lib/admin-auth";
import { UserRole } from "@/types/database";
import { z } from "zod";

// Define a schema for role updates
const UpdateRoleSchema = z.object({
  role: z.enum(["PENDING", "READONLY", "USER", "STAFF", "MANAGER", "ADMIN"]),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const userId = params.id;

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });

    if (!userExists) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
          code: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // Parse and validate the request body
    const body = await request.json();
    const updateData = UpdateRoleSchema.parse(body);

    // Update the user's role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: updateData.role,
        ...(updateData.isActive !== undefined && {
          isActive: updateData.isActive,
        }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // Log the action
    console.log(
      `User ${adminValidation.user?.email} updated role for user ${userExists.email} to ${updateData.role}`
    );

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: `User role updated successfully to ${updateData.role}`,
    });
  } catch (error) {
    console.error("Error updating user role:", error);

    // Check for validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input data",
          details: error.errors,
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update user role. Please try again later.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
