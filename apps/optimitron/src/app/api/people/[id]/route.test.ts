import { describe, expect, it } from "vitest";
import { PATCH, DELETE } from "./route";

describe("retired Court write endpoint", () => {
  it("returns 410 and the Court destination for PATCH", async () => {
    const response = await PATCH(new Request("https://optimitron.com/api/legacy", { method: "PATCH", body: "invalid JSON" }), { params: Promise.resolve({ id: "record-1" }) });
    expect(response.status).toBe(410);
    expect(await response.json()).toMatchObject({ code: "COURT_ENDPOINT_MOVED", endpoint: "https://courtofhumanity.org/api/people/record-1" });
  });
  it("returns 410 and the Court destination for DELETE", async () => {
    const response = await DELETE(new Request("https://optimitron.com/api/legacy", { method: "DELETE", body: "invalid JSON" }), { params: Promise.resolve({ id: "record-1" }) });
    expect(response.status).toBe(410);
    expect(await response.json()).toMatchObject({ code: "COURT_ENDPOINT_MOVED", endpoint: "https://courtofhumanity.org/api/people/record-1" });
  });
});
