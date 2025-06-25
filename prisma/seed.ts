import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create whitelisted domains
  const domains = ["testcompany.com", "example.org", "alohawaii.test"];

  for (const domain of domains) {
    await prisma.whitelistedDomain.upsert({
      where: { domain },
      update: {},
      create: {
        domain,
        isActive: true,
      },
    });
  }

  // Create test users
  const testUsers = [
    {
      email: "admin@testcompany.com",
      name: "Test Admin",
      role: UserRole.ADMIN,
    },
    {
      email: "manager@testcompany.com",
      name: "Test Manager",
      role: UserRole.MANAGER,
    },
    {
      email: "staff@testcompany.com",
      name: "Test Staff",
      role: UserRole.STAFF,
    },
    {
      email: "user@testcompany.com",
      name: "Test User",
      role: UserRole.USER,
    },
  ];

  for (const user of testUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
  }

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
