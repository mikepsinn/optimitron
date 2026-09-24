import type { NextFetchEvent } from "next/server";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import middleware from "@/middleware";
import { OAUTH_CONSENT_FLOW_HEADER } from "@/lib/oauth-consent-flow";

// next-auth/middleware is deliberately NOT mocked. withAuth returns before it
// calls the wrapped function on its own sign-in page, and a mock hides that.
const event = { waitUntil: () => undefined } as unknown as NextFetchEvent;

/** Next.js reports a forwarded request header as `x-middleware-request-<name>`. */
async function forwardedFlowHeader(
  path: string,
  headers?: Record<string, string>,
) {
  const response = await middleware(
    new NextRequest(`https://optimitron.com${path}`, { headers }),
    event,
  );
  return (
    response?.headers.get(`x-middleware-request-${OAUTH_CONSENT_FLOW_HEADER}`) ??
    null
  );
}

describe("middleware OAuth consent flow header", () => {
  it("reaches the sign-in page, which withAuth skips", async () => {
    expect(
      await forwardedFlowHeader(
        "/auth/signin?callbackUrl=%2Fmcp%2Fauthorize%3Fclient_id%3Dabc",
      ),
    ).toBe("1");
  });

  it("leaves an ordinary sign-in alone", async () => {
    expect(await forwardedFlowHeader("/auth/signin")).toBeNull();
    expect(
      await forwardedFlowHeader("/auth/signin?callbackUrl=%2Fdashboard"),
    ).toBeNull();
  });

  it("drops a client-sent copy on the sign-in page", async () => {
    const response = await middleware(
      new NextRequest("https://optimitron.com/auth/signin", {
        headers: { [OAUTH_CONSENT_FLOW_HEADER]: "1", "x-kept": "yes" },
      }),
      event,
    );
    // Next.js forwards only the headers named here. A missing list would mean
    // the request passed through untouched, client-sent header included.
    const forwarded = response?.headers.get("x-middleware-override-headers");
    expect(forwarded?.split(",")).toContain("x-kept");
    expect(forwarded?.split(",")).not.toContain(OAUTH_CONSENT_FLOW_HEADER);
  });
});
