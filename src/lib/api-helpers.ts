import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { ApiResponse } from "@/types";
import { UserRole } from "@prisma/client";
import { prisma } from "./db";

// Get authenticated user from request
export async function getAuthenticatedUser(req?: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email!,
    name: session.user.name,
    role: session.user.role,
    domain: session.user.domain,
  };
}

// Check if user has required role
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy = {
    CUSTOMER: 0,
    ADMIN: 1,
    SUPER_ADMIN: 2,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

// API response helpers
export function successResponse<T>(
  data: T,
  message = "Success"
): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
  };
}

export function errorResponse(message: string, error?: string): ApiResponse {
  return {
    success: false,
    message,
    error,
  };
}

// HTTP status responses
export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function createErrorResponse(error: ApiError | Error, statusCode = 500) {
  if (error instanceof ApiError) {
    return Response.json(errorResponse(error.message, error.code), {
      status: error.statusCode,
    });
  }

  return Response.json(errorResponse("Internal server error"), {
    status: statusCode,
  });
}

// Domain validation
export async function isEmailFromWhitelistedDomain(
  email: string
): Promise<boolean> {
  try {
    // Extract domain from email
    const emailParts = email.split("@");
    if (emailParts.length !== 2) {
      return false;
    }

    const domain = emailParts[1];

    // Check if domain is whitelisted
    const whitelistedDomain = await prisma.whitelistedDomain.findUnique({
      where: { domain },
    });

    return !!whitelistedDomain;
  } catch (error) {
    console.error("Error checking whitelisted domain:", error);
    return false;
  }
}

// Create API response helper
export function createApiResponse<T>(
  success: boolean,
  message: string,
  data?: T
): ApiResponse<T> {
  return {
    success,
    message,
    data,
  };
}

// Permission checking
export function hasPermission(user: any, requiredPermission: string): boolean {
  if (!user) {
    return false;
  }

  const role = user.role;

  switch (requiredPermission) {
    case "super_admin":
      return role === "SUPER_ADMIN";
    case "admin":
      return role === "ADMIN" || role === "SUPER_ADMIN";
    case "customer":
      return role === "CUSTOMER" || role === "ADMIN" || role === "SUPER_ADMIN";
    default:
      return false;
  }
}
