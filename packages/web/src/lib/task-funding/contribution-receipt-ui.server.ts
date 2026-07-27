import {
  type ContributionReceiptV1,
  type OutcomeAddendumV1,
  getContributionReceiptForViewer,
} from "@/lib/task-funding/contribution-receipts.server";
import { canUserManageTask } from "@/lib/tasks/task-visibility.server";

const RECEIPT_TASK_ID_PREFIX = "task-funding-receipt:";

export interface ContributionReceiptPanelData {
  addenda: Array<OutcomeAddendumV1 & { artifactId: string }>;
  canManage: boolean;
  contentHash: string;
  receipt: ContributionReceiptV1;
  receiptArtifactId: string;
}

export async function getContributionReceiptPanelData(
  taskId: string,
  userId: string,
): Promise<ContributionReceiptPanelData | null> {
  if (!taskId.startsWith(RECEIPT_TASK_ID_PREFIX)) return null;
  const paymentId = taskId.slice(RECEIPT_TASK_ID_PREFIX.length);
  if (!paymentId) return null;
  const result = await getContributionReceiptForViewer(paymentId, userId).catch(
    () => null,
  );
  if (!result || result.receiptTask.id !== taskId) return null;

  return {
    addenda: result.addenda.map(({ addendum, artifactId }) => ({
      ...addendum,
      artifactId,
    })),
    canManage: await canUserManageTask(result.receipt.intendedTask.id, userId),
    contentHash: result.receiptArtifact.contentHash,
    receipt: result.receipt,
    receiptArtifactId: result.receiptArtifact.id,
  };
}
