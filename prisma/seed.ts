import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await hash("admin123456", 12);
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
  const designerPassword = await hash("designer123456", 12);
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
  const buyerPassword = await hash("buyer123456", 12);
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
  console.log("  Admin:    admin@3dmstore.com / admin123456");
  console.log("  Designer: designer@example.com / designer123456");
  console.log("  Buyer:    buyer@example.com / buyer123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
