import { requireTaskRequestAuth } from "@/lib/auth-utils";
import { noStoreJson } from "@/lib/content-http.server";
import { appendContributionOutcomeAddendum } from "@/lib/task-funding/contribution-receipts.server";
import { contributionReceiptErrorResponse } from "../../http";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ paymentId: string }> },
) {
  try {
    const { clientAccessBoundary, userId } =
      await requireTaskRequestAuth(request);
    const { paymentId } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const result = await appendContributionOutcomeAddendum(
      { ...body, paymentId },
      userId,
      { clientAccessBoundary },
    );
    return noStoreJson(result, { status: result.created ? 201 : 200 });
  } catch (error) {
    return contributionReceiptErrorResponse(
      error,
      "Failed to append the contribution receipt addendum.",
    );
  }
}
