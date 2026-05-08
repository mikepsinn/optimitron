import "./load-env";
import { prisma } from "../src/lib/prisma";

async function main() {
  // Pull anything that looks like funding/donation/fund-the-campaign work,
  // matching against title and description (case-insensitive). Not deleting
  // anything — this script is read-only so the human can see exactly what
  // exists before deciding what to remove.
  const tasks = await prisma.task.findMany({
    where: {
      deletedAt: null,
      OR: [
        { title: { contains: "fund", mode: "insensitive" } },
        { title: { contains: "donat", mode: "insensitive" } },
        { title: { contains: "campaign", mode: "insensitive" } },
        { taskKey: { contains: "fund", mode: "insensitive" } },
        { taskKey: { contains: "donat", mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      title: true,
      taskKey: true,
      isPublic: true,
      status: true,
      assigneeOrganizationId: true,
      assigneePersonId: true,
      createdByUserId: true,
      createdAt: true,
      description: true,
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  console.log(`Found ${tasks.length} candidate funding-related tasks:\n`);
  for (const task of tasks) {
    console.log(`  id:           ${task.id}`);
    console.log(`  title:        ${task.title}`);
    console.log(`  taskKey:      ${task.taskKey ?? "(none)"}`);
    console.log(`  isPublic:     ${task.isPublic}`);
    console.log(`  status:       ${task.status}`);
    console.log(`  assigneeOrg:  ${task.assigneeOrganizationId ?? "(none)"}`);
    console.log(
      `  assigneePer:  ${task.assigneePersonId ?? "(none)"}`,
    );
    console.log(`  createdAt:    ${task.createdAt.toISOString()}`);
    console.log(
      `  description:  ${(task.description ?? "").slice(0, 200).replace(/\s+/g, " ")}${
        (task.description ?? "").length > 200 ? "..." : ""
      }`,
    );
    console.log("");
  }

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
