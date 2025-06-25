// Database interface - uses mocks for tests
import { PrismaClient } from "@prisma/client";

const isTestEnvironment = process.env.NODE_ENV === "test";

let prismaInstance: PrismaClient;

if (isTestEnvironment) {
  // For tests, use a mocked client
  // This prevents any real database operations during tests
  const mockExtended = require("jest-mock-extended");

  // Create a mock instance of PrismaClient
  const prismaMock = mockExtended.mockDeep();

  // If using singleton pattern, reset between tests
  if (typeof beforeEach === "function") {
    beforeEach(() => {
      mockExtended.mockReset(prismaMock);
    });
  }

  prismaInstance = prismaMock as unknown as PrismaClient;
} else {
  // For development and production
  prismaInstance = new PrismaClient();
}

export const prisma = prismaInstance;
