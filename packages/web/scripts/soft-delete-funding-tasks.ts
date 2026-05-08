import "./load-env";
import { TaskCommunicationStatus, TaskStatus } from "@optimitron/db";
import { prisma } from "../src/lib/prisma";

/**
 * Soft-deletes the foundation grant-asking tasks identified by the human
 * after the funding-tasks audit. Also cancels any DRAFT TaskCommunications
 * tied to those tasks so the email pipeline doesn't send queued messages
 * after the task is gone.
 *
 * Soft-delete (deletedAt = now) preserves the audit trail; TaskComment +
 * EmailLog history stays intact so we can reconstruct the campaign
 * without losing what was sent.
 */

const TARGET_TASK_KEYS = [
  "icewad:grant:schmidt-futures",
  "icewad:grant:skoll-foundation",
  "icewad:grant:omidyar-network",
  "grant:sff:fund-treaty-campaign",
  "grant:open-phil:fund-treaty-campaign",
];

async function main() {
  const now = new Date();
  const tasks = await prisma.task.findMany({
    where: { taskKey: { in: TARGET_TASK_KEYS }, deletedAt: null },
    select: {
      id: true,
      title: true,
      taskKey: true,
      assigneeOrganizationId: true,
    },
  });

  console.log(`Soft-deleting ${tasks.length} funding tasks:`);
  for (const task of tasks) {
    console.log(`  - ${task.taskKey}: "${task.title}" (id: ${task.id})`);
  }

  const taskIds = tasks.map((t) => t.id);

  // Cancel DRAFT TaskCommunications so the email pipeline doesn't send
  // queued messages after the task is gone. Already-SENT communications
  // are left alone — the email already went out, no recall.
  const [cancelledComms, result] = await prisma.$transaction([
    prisma.taskCommunication.updateMany({
      where: {
        taskId: { in: taskIds },
        status: TaskCommunicationStatus.DRAFT,
        deletedAt: null,
      },
      data: {
        cancelledAt: now,
        errorMessage: "Task soft-deleted before send.",
        status: TaskCommunicationStatus.CANCELLED,
      },
    }),
    prisma.task.updateMany({
      where: { id: { in: taskIds }, deletedAt: null },
      data: {
        deletedAt: now,
        status: TaskStatus.CANCELLED,
      },
    }),
  ]);
  console.log(
    `\nCancelled ${cancelledComms.count} DRAFT task communications.`,
  );
  console.log(`\nSoft-deleted ${result.count} tasks.`);

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
