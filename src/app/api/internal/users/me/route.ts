import { NextRequest } from "next/server";
import {
  getAuthenticatedUser,
  successResponse,
  errorResponse,
  hasRole,
} from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { UpdateUserSchema } from "@/types";
import { createApiAuthMiddleware } from "@/middleware/apiAuth";

// Create middleware for internal routes
const apiAuthMiddleware = createApiAuthMiddleware('internal');

/**
 * @swagger
 * /api/internal/users/me:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieve the authenticated user's profile information
 *     tags:
 *       - Internal
 *       - Users
 *     security:
 *       - googleOAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   put:
 *     summary: Update current user profile
 *     description: Update the authenticated user's profile information
 *     tags:
 *       - Internal
 *       - Users
 *     security:
 *       - googleOAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's display name
 *                 example: "John Doe"
 *               role:
 *                 type: string
 *                 enum: ['CUSTOMER', 'ADMIN', 'SUPER_ADMIN']
 *                 description: User role (admin only)
 *               isActive:
 *                 type: boolean
 *                 description: Account status (admin only)
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function GET(req: NextRequest) {
  // Check API key authorization for internal routes
  const authResult = apiAuthMiddleware(req);
  if (authResult) return authResult;

  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return Response.json(errorResponse("Authentication required"), {
        status: 401,
      });
    }

    // Get user data from database, excluding sensitive timestamp fields
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        isActive: true,
      },
    });

    if (!fullUser) {
      return Response.json(errorResponse("User not found"), { status: 404 });
    }

    return Response.json(successResponse(fullUser));
  } catch (error) {
    console.error("Get user profile error:", error);
    return Response.json(errorResponse("Failed to get user profile"), {
      status: 500,
    });
  }
}

/**
 * @swagger
 * /api/internal/users/me:
 *   put:
 *     summary: Update current user profile
 *     description: Update the authenticated user's profile information
 *     tags:
 *       - Internal
 *       - Users
 *     security:
 *       - googleOAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's display name
 *                 example: "John Doe"
 *               role:
 *                 type: string
 *                 enum: ['CUSTOMER', 'ADMIN', 'SUPER_ADMIN']
 *                 description: User role (admin only)
 *               isActive:
 *                 type: boolean
 *                 description: Account status (admin only)
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// PUT /api/internal/users/me - Update current user profile
export async function PUT(req: NextRequest) {
  // Check API key authorization for internal routes
  const authResult = apiAuthMiddleware(req);
  if (authResult) return authResult;

  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return Response.json(errorResponse("Authentication required"), {
        status: 401,
      });
    }

    const body = await req.json();
    const updateData = UpdateUserSchema.parse(body);

    // Regular users can only update their name and language preference
    // Admins can update role and isActive for other users
    const allowedUpdates: any = {
      name: updateData.name,
      language: updateData.language,
    };

    if (hasRole(user.role, "ADMIN")) {
      if (updateData.role) allowedUpdates.role = updateData.role;
      if (updateData.isActive !== undefined)
        allowedUpdates.isActive = updateData.isActive;
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: allowedUpdates,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        domain: true,
        language: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return Response.json(
      successResponse(updatedUser, "Profile updated successfully")
    );
  } catch (error) {
    console.error("Update user profile error:", error);
    return Response.json(errorResponse("Failed to update profile"), {
      status: 500,
    });
  }
}
