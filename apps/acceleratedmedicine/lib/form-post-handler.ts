import { createHmac } from "node:crypto";

import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

import { FormSubmissionRateLimitError } from "@/lib/form-submission-store";

function clientKeyForRequest(request: Request): string {
  // The secret predates the partner form; both forms share it.
  const secret = process.env.RIGHT_TO_TRY_RATE_LIMIT_SECRET;
  if (!secret) {
    throw new Error("Form rate-limit secret is not configured");
  }
  const address =
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  return createHmac("sha256", secret).update(address).digest("hex");
}

type Submit<Result> = (
  input: unknown,
  options: { clientKey: string },
) => Promise<Result>;

interface PostDependencies {
  clientKeyForRequest?: (request: Request) => string;
}

/** POST handler for a public site form: validate, store and email, and map failures to status codes. */
export function createFormPostHandler<Result extends object>(
  schema: ZodType,
  submit: Submit<Result>,
  dependencies: PostDependencies = {},
) {
  const getClientKey = dependencies.clientKeyForRequest ?? clientKeyForRequest;

  return async function post(request: Request) {
    try {
      const input = schema.parse(await request.json());
      const result = await submit(input, {
        clientKey: getClientKey(request),
      });
      return NextResponse.json({ ok: true, ...result });
    } catch (error) {
      if (error instanceof FormSubmissionRateLimitError) {
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

      console.error("Form submission failed", error);
      return NextResponse.json(
        {
          ok: false,
          error:
            "We could not send this. Please try again or email hello@acceleratedmedicine.org.",
        },
        { status: 503 },
      );
    }
  };
}
