import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  retrieveManualContext: vi.fn(),
}));

vi.mock("@/lib/manual-search.server", () => ({
  retrieveManualContext: mocks.retrieveManualContext,
}));

import { POST } from "./route";

describe("voice rag route", () => {
  beforeEach(() => {
    mocks.retrieveManualContext.mockReset();
  });

  it("returns retrieved manual context and citations", async () => {
    mocks.retrieveManualContext.mockResolvedValue({
      context: "Clinical trials cost less when embedded in care.",
      citations: [
        {
          score: 7.2,
          title: "A Decentralized FDA",
          url: "https://manual.warondisease.org/knowledge/solution/dfda.html",
        },
      ],
    });

    const response = await POST(
      new NextRequest("http://localhost/api/voice/rag", {
        method: "POST",
        body: JSON.stringify({ query: "FDA approval timeline" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.retrieveManualContext).toHaveBeenCalledWith("FDA approval timeline");
    await expect(response.json()).resolves.toEqual({
      context: "Clinical trials cost less when embedded in care.",
      citations: [
        {
          score: 7.2,
          title: "A Decentralized FDA",
          url: "https://manual.warondisease.org/knowledge/solution/dfda.html",
        },
      ],
    });
  });

  it("rejects requests without a query string", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/voice/rag", {
        method: "POST",
        body: JSON.stringify({ query: "" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Missing required field: query",
    });
  });

  it("returns 502 when retrieval fails", async () => {
    mocks.retrieveManualContext.mockRejectedValue(new Error("upstream failed"));

    const response = await POST(
      new NextRequest("http://localhost/api/voice/rag", {
        method: "POST",
        body: JSON.stringify({ query: "Wishocracy math" }),
      }),
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "upstream failed",
    });
  });
});
