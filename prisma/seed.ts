import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await hash("admin123456", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@rhinomarket.com" },
    update: {},
    create: {
      email: "admin@rhinomarket.com",
      name: "Admin",
      passwordHash: adminPassword,
      role: "ADMIN",
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

  // Create categories
  const categories = [
    { name: "Architecture", slug: "architecture", description: "Buildings, structures, and architectural elements" },
    { name: "Furniture", slug: "furniture", description: "Chairs, tables, sofas, and interior furnishings" },
    { name: "Product Design", slug: "product-design", description: "Consumer products, electronics, and industrial design" },
    { name: "Jewelry", slug: "jewelry", description: "Rings, necklaces, watches, and accessories" },
    { name: "Transportation", slug: "transportation", description: "Cars, boats, aircraft, and vehicles" },
    { name: "Nature", slug: "nature", description: "Plants, trees, rocks, and organic forms" },
    { name: "Mechanical", slug: "mechanical", description: "Machine parts, engines, and mechanical assemblies" },
    { name: "Characters", slug: "characters", description: "People, animals, and fantasy characters" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log("Categories created");

  console.log("\nSeed completed!");
  console.log("\nTest accounts:");
  console.log("  Admin:    admin@rhinomarket.com / admin123456");
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
