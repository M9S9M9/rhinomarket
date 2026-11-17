import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

// Test-account passwords are NEVER stored in the code (this repository is public).
// Set SEED_ADMIN_PASSWORD / SEED_DESIGNER_PASSWORD / SEED_BUYER_PASSWORD, or a random
// password is generated and printed once in the terminal.
function seedPassword(envVar: string, label: string): string {
  const fromEnv = process.env[envVar];
  if (fromEnv && fromEnv.length >= 12) return fromEnv;
  const generated = randomBytes(12).toString("base64url");
  console.log(`  ${label} password (generated, shown once): ${generated}`);
  return generated;
}

async function main() {
  // This script replaces all categories and creates test accounts — never run it
  // against the live database by accident.
  if (process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production") {
    if (process.env.SEED_ALLOW_PRODUCTION !== "yes") {
      console.error("Refusing to seed a production database. Set SEED_ALLOW_PRODUCTION=yes to override.");
      process.exit(1);
    }
  }
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await hash(seedPassword("SEED_ADMIN_PASSWORD", "Admin"), 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@3dmstore.com" },
    update: {},
    create: {
      email: "admin@3dmstore.com",
      name: "Admin",
      passwordHash: adminPassword,
      role: "ADMIN",
      uploadLimit: 9999,
      emailVerified: new Date(),
    },
  });
  console.log("Admin created:", admin.email);

  // Create a test designer
  const designerPassword = await hash(seedPassword("SEED_DESIGNER_PASSWORD", "Designer"), 12);
  const designer = await prisma.user.upsert({
    where: { email: "designer@example.com" },
    update: {},
    create: {
      email: "designer@example.com",
      name: "Jane Designer",
      passwordHash: designerPassword,
      role: "DESIGNER",
      emailVerified: new Date(),
      bio: "Professional 3D modeler specializing in architectural visualization and product design.",
    },
  });
  console.log("Designer created:", designer.email);

  // Create a test buyer
  const buyerPassword = await hash(seedPassword("SEED_BUYER_PASSWORD", "Buyer"), 12);
  const buyer = await prisma.user.upsert({
    where: { email: "buyer@example.com" },
    update: {},
    create: {
      email: "buyer@example.com",
      name: "John Buyer",
      passwordHash: buyerPassword,
      role: "BUYER",
      emailVerified: new Date(),
    },
  });
  console.log("Buyer created:", buyer.email);

  // Replace all categories
  await prisma.category.deleteMany();
  const categories = [
    { name: "Footwear", slug: "footwear", description: "Shoes, sandals, boots, and footwear designs" },
    { name: "Jewelry", slug: "jewelry", description: "Rings, necklaces, bracelets, and accessories" },
    { name: "Architect", slug: "architect", description: "Buildings, structures, and architectural elements" },
    { name: "Human Artificial Limbs", slug: "human-artificial-limbs", description: "Prosthetics and orthotic devices" },
    { name: "Industrial Parts", slug: "industrial-parts", description: "Machine parts, components, and industrial designs" },
    { name: "Other", slug: "other", description: "Other 3D models" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log("Categories created");

  // Create default app settings
  await prisma.appSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, commissionPercent: 15 },
  });
  console.log("App settings created");

  console.log("\nSeed completed!");
  console.log("\nTest accounts:");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
