import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@/types/database";

export interface AdminAuthResult {
  isValid: boolean;
  error?: string;
  user?: {
    id: string;
    role: UserRole;
    email: string;
  };
}

/**
 * Validates that the current user has admin permissions
 * Returns user info if valid, error message if not
 */
export async function validateAdminAuth(
  request: NextRequest
): Promise<AdminAuthResult> {
  try {
    // Get the session from NextAuth
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return {
        isValid: false,
        error: "Authentication required. Please sign in.",
      };
    }

    // Check if user has admin permissions
    const userRole = session.user.role;
    const isAdmin = userRole === UserRole.ADMIN;

    if (!isAdmin) {
      return {
        isValid: false,
        error:
          "Admin permissions required. Your role does not have access to this resource.",
      };
    }

    return {
      isValid: true,
      user: {
        id: session.user.id,
        role: session.user.role,
        email: session.user.email!,
      },
    };
  } catch (error) {
    console.error("Error validating admin auth:", error);
    return {
      isValid: false,
      error: "Authentication validation failed. Please try again.",
    };
  }
}

/**
 * Helper to check if a user role has admin privileges
 */
export function isAdminRole(role: UserRole): boolean {
  return role === UserRole.ADMIN;
}

/**
 * Helper to check if a user role has manager or higher privileges
 */
export function isManagerRole(role: UserRole): boolean {
  return role === UserRole.MANAGER || isAdminRole(role);
}

/**
 * Helper to check if a user role has staff or higher privileges
 */
export function isStaffRole(role: UserRole): boolean {
  return role === UserRole.STAFF || isManagerRole(role);
}
