import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create whitelisted domains
  const domains = ["gmail.com", "yourdomain.com", "anotherdomain.org"];

  for (const domain of domains) {
    await prisma.whitelistedDomain.upsert({
      where: { domain },
      update: {},
      create: {
        domain,
        isActive: true,
      },
    });
    console.log(`✅ Whitelisted domain: ${domain}`);
  }

  console.log("✨ Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
