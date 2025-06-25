import { z } from "zod";

// API Response schemas
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().optional(),
  error: z.string().optional(),
});

export const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  total: z.number().optional(),
  totalPages: z.number().optional(),
});

// User validation schemas
export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  role: z
    .enum(["PENDING", "READONLY", "USER", "STAFF", "MANAGER", "ADMIN"])
    .default("PENDING"),
});

export const UpdateUserSchema = z.object({
  name: z.string().optional(),
  role: z
    .enum(["PENDING", "READONLY", "USER", "STAFF", "MANAGER", "ADMIN"])
    .optional(),
  isActive: z.boolean().optional(),
});

export type ApiResponse<T = any> = z.infer<typeof ApiResponseSchema> & {
  data?: T;
};

export type Pagination = z.infer<typeof PaginationSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
