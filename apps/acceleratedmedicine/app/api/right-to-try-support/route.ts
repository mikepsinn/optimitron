import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { sendRightToTrySupport } from "@/lib/right-to-try-support";

const SUBMISSION_WINDOW_MS = 10 * 60 * 1000;
const SUBMISSIONS_PER_WINDOW = 5;
const submissionBuckets = new Map<
  string,
  { count: number; resetAt: number }
>();

function isRateLimited(key: string, now = Date.now()): boolean {
  const existing = submissionBuckets.get(key);
  if (!existing || existing.resetAt <= now) {
    submissionBuckets.set(key, {
      count: 1,
      resetAt: now + SUBMISSION_WINDOW_MS,
    });
    return false;
  }

  existing.count += 1;
  return existing.count > SUBMISSIONS_PER_WINDOW;
}

export async function POST(request: Request) {
  const clientKey =
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";

  if (isRateLimited(clientKey)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "We received several responses from this connection. Please wait a few minutes or email hello@acceleratedmedicine.org.",
      },
      { status: 429 },
    );
  }

  try {
    const result = await sendRightToTrySupport(await request.json());
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: "Please check the highlighted fields." },
        { status: 400 },
      );
    }

    console.error("Right to Try support response failed", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          "We could not record this response. Please try again or email hello@acceleratedmedicine.org.",
      },
      { status: 503 },
    );
  }
}
