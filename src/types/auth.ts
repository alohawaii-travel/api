import { UserRole } from "@prisma/client";

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
