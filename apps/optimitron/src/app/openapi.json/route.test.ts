import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("openapi.json route", () => {
  it("varies the cache by host headers used to generate the server URL", async () => {
    const response = await GET(
      new Request("https://optimitron.test/openapi.json", {
        headers: {
          host: "optimitron.test",
          "x-forwarded-host": "warondisease.org",
          "x-forwarded-proto": "https",
        },
      }),
    );

    expect(response.headers.get("Vary")).toBe(
      "Host, X-Forwarded-Host, X-Forwarded-Proto",
    );
  });
});
