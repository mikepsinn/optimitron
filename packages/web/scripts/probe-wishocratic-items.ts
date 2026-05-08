import "./load-env";
import { prisma } from "../src/lib/prisma";

async function main() {
  const items = await prisma.wishocraticItem.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, jurisdictionId: true },
    orderBy: { name: "asc" },
    take: 200,
  });
  console.log(`WishocraticItem rows in destination: ${items.length}`);
  for (const item of items) {
    console.log(`   ${item.id}  ${item.name}  (juris=${item.jurisdictionId})`);
  }
  await prisma.$disconnect();
}

void main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
