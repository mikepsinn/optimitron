import { requireTaskRequestAuth } from "@/lib/auth-utils";
import { noStoreJson } from "@/lib/content-http.server";
import { issueContributionReceipt } from "@/lib/task-funding/contribution-receipts.server";
import { contributionReceiptErrorResponse } from "./http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { clientAccessBoundary, userId } =
      await requireTaskRequestAuth(request);
    const result = await issueContributionReceipt(
      await request.json(),
      userId,
      { clientAccessBoundary },
    );
    return noStoreJson(result, { status: result.created ? 201 : 200 });
  } catch (error) {
    return contributionReceiptErrorResponse(
      error,
      "Failed to issue the contribution receipt.",
    );
  }
}
