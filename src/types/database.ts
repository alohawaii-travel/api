// Local type definitions to replace Prisma-generated types

export enum UserRole {
  USER = "USER",
  STAFF = "STAFF",
  MANAGER = "MANAGER",
  ADMIN = "ADMIN",
}

export interface User {
  id: string;
  email: string;
  name?: string | null;
  avatar?: string | null;
  role: UserRole;
  isActive: boolean;
  googleId?: string | null;
  domain?: string | null;
  language?: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date | null;
}

export interface WhitelistedDomain {
  id: string;
  domain: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Account {
  id: string;
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token?: string | null;
  access_token?: string | null;
  expires_at?: number | null;
  token_type?: string | null;
  scope?: string | null;
  id_token?: string | null;
  session_state?: string | null;
}

export interface Session {
  id: string;
  sessionToken: string;
  userId: string;
  expires: Date;
}
