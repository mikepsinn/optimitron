import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth-utils";
import { createLogger } from "@/lib/logger";
import {
  createTaskFundingCheckoutSession,
  MAX_TASK_FUNDING_AMOUNT_CENTS,
  MIN_TASK_FUNDING_AMOUNT_CENTS,
} from "@/lib/task-funding/payments.server";

export const runtime = "nodejs";

const log = createLogger("task-funding-checkout");

const CheckoutBodySchema = z.object({
  amountCents: z
    .number()
    .int()
    .min(MIN_TASK_FUNDING_AMOUNT_CENTS)
    .max(MAX_TASK_FUNDING_AMOUNT_CENTS),
  donorEmail: z.string().trim().email().max(320).nullish(),
  donorName: z.string().trim().max(200).nullish(),
  publicDisplay: z.boolean().default(false),
  publicName: z.string().trim().max(200).nullish(),
  sourceReferrer: z.string().trim().max(500).nullish(),
  sourceUrl: z.string().trim().max(500).nullish(),
});

function getErrorStatus(error: unknown) {
  if (!(error instanceof Error)) return 500;
  if (/not found/i.test(error.message)) return 404;
  if (/Stripe is not configured/i.test(error.message)) return 503;
  if (/amount|USD|funding/i.test(error.message)) return 400;
  return 500;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const parsed = CheckoutBodySchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid task funding checkout payload." },
      { status: 400 },
    );
  }

  try {
    const currentUser = await getCurrentUser(request).catch(() => null);
    const result = await createTaskFundingCheckoutSession({
      ...parsed.data,
      donorUserId: currentUser?.id ?? null,
      taskId: id,
    });

    return NextResponse.json({
      checkoutSessionId: result.checkoutSessionId,
      commerceOrderId: result.commerceOrderId,
      taskFundingPaymentId: result.taskFundingPaymentId,
      url: result.url,
    });
  } catch (error) {
    const status = getErrorStatus(error);
    if (status >= 500) {
      // Raw internals ("Stripe is not configured.") read as a broken or fake
      // checkout to users. Log the real error; show a calm, safe one.
      log.error("Task funding checkout failed", { error });
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
            : "Failed to create task funding checkout.",
      },
      { status },
    );
  }
}
