import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-utils";
import { createLogger } from "@/lib/logger";
import { getTaskPath } from "@/lib/routes";
import { createPledgeCardSetupSession } from "@/lib/task-funding/escrow.server";
import {
  MAX_TASK_FUNDING_AMOUNT_CENTS,
  MIN_TASK_FUNDING_AMOUNT_CENTS,
} from "@/lib/task-funding/payments.server";
import { decodeTaskRouteId } from "@/lib/tasks/task-route-id";
import { getBaseUrl } from "@/lib/url";

export const runtime = "nodejs";

const log = createLogger("task-funding-pledge-setup");

const PledgeSetupBodySchema = z.object({
  amountCents: z
    .number()
    .int()
    .min(MIN_TASK_FUNDING_AMOUNT_CENTS)
    .max(MAX_TASK_FUNDING_AMOUNT_CENTS),
  publicDisplay: z.boolean().default(false),
  // Accepted for parity with the pay-now checkout form; the pledge snapshot
  // uses the signed-in person's display name (pledges.server resolveActor).
  publicName: z.string().trim().max(200).nullish(),
});

function isUnauthorized(error: unknown) {
  return error instanceof Error && error.message === "Unauthorized";
}

function getErrorStatus(error: unknown) {
  if (!(error instanceof Error)) return 500;
  if (/not found/i.test(error.message)) return 404;
  if (/Stripe is not configured/i.test(error.message)) return 503;
  if (/target is closed/i.test(error.message)) return 409;
  if (/amount|USD|funding|person profile/i.test(error.message)) return 400;
  return 500;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAuth();
    const { id: routeId } = await context.params;
    const id = decodeTaskRouteId(routeId);
    const parsed = PledgeSetupBodySchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid pledge payload." },
        { status: 400 },
      );
    }

    const baseUrl = getBaseUrl();
    const taskPath = getTaskPath(id);
    const result = await createPledgeCardSetupSession({
      amountCents: parsed.data.amountCents,
      cancelUrl: `${baseUrl}${taskPath}?pledge_canceled=1#funding`,
      publicDisplay: parsed.data.publicDisplay,
      successUrl: `${baseUrl}${taskPath}?pledged=1&session_id={CHECKOUT_SESSION_ID}#funding`,
      taskId: id,
      userId: auth.userId,
    });

    return NextResponse.json({ pledgeId: result.pledgeId, url: result.url });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const status = getErrorStatus(error);
    if (status >= 500) {
      // Raw internals ("Stripe is not configured.") read as a broken or fake
      // checkout to users. Log the real error; show a calm, safe one.
      log.error("Pledge setup failed", { error });
      return NextResponse.json(
        {
          error:
            "Payments are temporarily down. Nothing was charged — try again in a few minutes.",
        },
        { status },
      );
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to start the pledge.",
      },
      { status },
    );
  }
}
