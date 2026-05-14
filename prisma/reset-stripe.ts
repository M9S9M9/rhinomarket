import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      stripeAccountId: { startsWith: "acct_dev_" },
    },
  });

  console.log(`Found ${users.length} users with dev mock accounts`);

  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        stripeAccountId: null,
        stripeOnboarding: false,
      },
    });
    console.log(`Reset ${user.email}`);
  }

  console.log("Done");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
