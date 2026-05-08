import "./load-env";
import {
  OPTIMIZE_EARTH_ROOT_TASK_ID,
  OPTIMIZE_EARTH_ROOT_TASK_KEY,
} from "@optimitron/db";
import { prisma } from "../src/lib/prisma";

/**
 * One-shot rename of the campaign-root task row.
 *
 * Old:  id="win-earth-optimization-prize", taskKey="program:earth-optimization-prize:win"
 * New:  id="optimize-earth",               taskKey="program:optimize-earth"
 *
 * The Task.parentTaskId FK has no ON UPDATE CASCADE, so we can't just
 * `UPDATE Task SET id = '...'`. Instead, in a single transaction we:
 *
 *   1. Snapshot the children currently pointing at the old root.
 *   2. NULL out their parentTaskId (FK becomes satisfiable).
 *   3. Rename the root row's id + taskKey.
 *   4. Re-point those children at the new root id.
 *
 * Idempotent: if the old row is already gone but the new row exists, we
 * skip step 3 and just verify children point at the new id.
 */

const OLD_ID = "win-earth-optimization-prize";
const OLD_KEY = "program:earth-optimization-prize:win";

async function main() {
  console.log("🌍 Rename optimize-earth root task");
  console.log(`   old id:  ${OLD_ID}`);
  console.log(`   old key: ${OLD_KEY}`);
  console.log(`   new id:  ${OPTIMIZE_EARTH_ROOT_TASK_ID}`);
  console.log(`   new key: ${OPTIMIZE_EARTH_ROOT_TASK_KEY}`);

  const oldRow = await prisma.task.findUnique({
    where: { id: OLD_ID },
    select: { id: true, taskKey: true },
  });
  const newRow = await prisma.task.findUnique({
    where: { id: OPTIMIZE_EARTH_ROOT_TASK_ID },
    select: { id: true, taskKey: true },
  });

  if (!oldRow && newRow) {
    console.log("   nothing to do — old row absent, new row present.");
    await prisma.$disconnect();
    return;
  }
  if (!oldRow && !newRow) {
    console.log(
      "   nothing to do — neither old nor new row exists. Run the seed.",
    );
    await prisma.$disconnect();
    return;
  }
  if (oldRow && newRow) {
    throw new Error(
      `Both old (${OLD_ID}) and new (${OPTIMIZE_EARTH_ROOT_TASK_ID}) rows exist. Resolve manually before re-running.`,
    );
  }

  const childIds = await prisma.task
    .findMany({
      where: { parentTaskId: OLD_ID },
      select: { id: true },
    })
    .then((rows) => rows.map((r) => r.id));

  console.log(`   children to repoint: ${childIds.length}`);

  await prisma.$transaction(async (tx) => {
    if (childIds.length > 0) {
      await tx.task.updateMany({
        where: { id: { in: childIds } },
        data: { parentTaskId: null },
      });
    }
    await tx.task.update({
      where: { id: OLD_ID },
      data: {
        id: OPTIMIZE_EARTH_ROOT_TASK_ID,
        taskKey: OPTIMIZE_EARTH_ROOT_TASK_KEY,
      },
    });
    if (childIds.length > 0) {
      await tx.task.updateMany({
        where: { id: { in: childIds } },
        data: { parentTaskId: OPTIMIZE_EARTH_ROOT_TASK_ID },
      });
    }
  });

  console.log("✅ rename complete");
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
