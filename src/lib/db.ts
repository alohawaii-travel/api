// Database interface - uses real Prisma for integration tests
import { PrismaClient } from "@prisma/client";

const isTestEnvironment = process.env.NODE_ENV === "test";

let prismaInstance: PrismaClient;

if (isTestEnvironment) {
  // For integration tests, always use the test database
  prismaInstance = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://test:test@localhost:5433/alohawaii_test",
      },
    },
  });
} else {
  // For development and production
  prismaInstance = new PrismaClient();
}

export const prisma = prismaInstance;
