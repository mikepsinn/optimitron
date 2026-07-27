import type { Prisma } from "@optimitron/db";

/** Serialize payment and CommerceOrder state transitions on the payment row. */
export async function lockTaskFundingPaymentInTransaction(
  paymentId: string,
  tx: Prisma.TransactionClient,
) {
  const rows = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT "id"
    FROM "TaskFundingPayment"
    WHERE "id" = ${paymentId}
    FOR UPDATE
  `;
  if (rows.length !== 1) {
    throw new Error(`Task funding payment ${paymentId} not found.`);
  }
}
