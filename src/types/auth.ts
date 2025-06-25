import { UserRole } from "./database";

// Permission levels mapping
export const PERMISSION_LEVELS = {
  CUSTOMER: 1,
  STAFF: 2,
  MANAGER: 3,
  ADMIN: 4,
  SUPER_ADMIN: 5,
} as const;

export type PermissionLevel = keyof typeof PERMISSION_LEVELS;

export interface ApiUser {
  id: string;
  email: string;
  name?: string | null;
  avatar?: string | null;
  role: UserRole;
  domain?: string | null;
  isActive: boolean;
  lastLoginAt?: Date | null;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: ApiUser;
}

export interface GoogleProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  hd?: string; // Google Workspace domain
}

export interface JWTPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
  domain?: string;
  iat?: number;
  exp?: number;
}

export interface UsersQueryParams {
  page?: number;
  limit?: number;
  role?: UserRole;
  search?: string;
  isActive?: boolean;
}

export interface UserListResponse {
  success: boolean;
  data: {
    users: ApiUser[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      limit: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
  message: string;
}
