import { createHmac } from "node:crypto";

import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  rightToTrySupportSchema,
  sendRightToTrySupport,
} from "@/lib/right-to-try-support";
import { RightToTryRateLimitError } from "@/lib/right-to-try-support-store";

function clientKeyForRequest(request: Request): string {
  const secret = process.env.RIGHT_TO_TRY_RATE_LIMIT_SECRET;
  if (!secret) {
    throw new Error("Right to Try rate-limit secret is not configured");
  }
  const address =
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  return createHmac("sha256", secret).update(address).digest("hex");
}

interface PostDependencies {
  clientKeyForRequest?: (request: Request) => string;
  submit?: typeof sendRightToTrySupport;
}

export function createPostHandler(dependencies: PostDependencies = {}) {
  const submit = dependencies.submit ?? sendRightToTrySupport;
  const getClientKey = dependencies.clientKeyForRequest ?? clientKeyForRequest;

  return async function post(request: Request) {
    try {
      const input = rightToTrySupportSchema.parse(await request.json());
      const result = await submit(input, {
        clientKey: getClientKey(request),
      });
      return NextResponse.json({ ok: true, ...result });
    } catch (error) {
      if (error instanceof RightToTryRateLimitError) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "We received several responses from this connection. Please wait a few minutes or email hello@acceleratedmedicine.org.",
          },
          { status: 429 },
        );
      }
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
  };
}
