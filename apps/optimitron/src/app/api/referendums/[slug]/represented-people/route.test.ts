import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("retired Court write endpoint", () => {
  it("returns 410 and the Court destination for POST", async () => {
    const response = await POST(new Request("https://optimitron.com/api/legacy", { method: "POST", body: "invalid JSON" }), { params: Promise.resolve({ slug: "record-1" }) });
    expect(response.status).toBe(410);
    expect(await response.json()).toMatchObject({ code: "COURT_ENDPOINT_MOVED", endpoint: "https://courtofhumanity.org/api/referendums/record-1/represented-people" });
  });
});
