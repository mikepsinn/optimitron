import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireSessionAuthMock } = vi.hoisted(() => ({
  requireSessionAuthMock: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  requireAuth: requireSessionAuthMock,
}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@optimitron/tracking", () => ({
  setTrackingPrismaProvider: vi.fn(),
  listMeasurementsForUser: vi.fn(),
  recordTrackingMeasurement: vi.fn(),
  updateMeasurementForUser: vi.fn(),
  deleteMeasurementForUser: vi.fn(),
}));

import {
  deleteMeasurementForUser,
  listMeasurementsForUser,
  recordTrackingMeasurement,
  updateMeasurementForUser,
} from "@optimitron/tracking";

import { DELETE, PATCH } from "./[id]/route";
import { GET, POST } from "./route";

const BASE = "http://localhost:3011/api/v1/measurements";

function jsonRequest(url: string, method: string, body: unknown) {
  return new Request(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("REST v1 measurements", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSessionAuthMock.mockResolvedValue({
      userId: "user-1",
      userEmail: "user-1@example.com",
    });
  });

  it("returns 401 with a WWW-Authenticate header when unauthenticated", async () => {
    requireSessionAuthMock.mockRejectedValue(
      new Error("Unauthorized - authentication required"),
    );
    const res = await GET(new Request(BASE));
    expect(res.status).toBe(401);
    expect(res.headers.get("WWW-Authenticate")).toContain("resource_metadata");
    const body = await res.json();
    expect(body.error.code).toBe("unauthorized");
    expect(listMeasurementsForUser).not.toHaveBeenCalled();
  });

  it("GET passes query filters and the session userId through to the core", async () => {
    vi.mocked(listMeasurementsForUser).mockResolvedValue({
      measurements: [{ id: "m1" }],
      nextCursor: null,
      variable: null,
    });
    const res = await GET(
      new Request(`${BASE}?variableName=Vitamin%20D&limit=5&cursor=m0`),
    );
    expect(res.status).toBe(200);
    expect(listMeasurementsForUser).toHaveBeenCalledWith(
      { cursor: "m0", limit: 5, variableName: "Vitamin D" },
      "user-1",
    );
    await expect(res.json()).resolves.toEqual({
      measurements: [{ id: "m1" }],
      nextCursor: null,
      variable: null,
    });
  });

  it("POST records a measurement and returns 201 with a result envelope", async () => {
    vi.mocked(recordTrackingMeasurement).mockResolvedValue({
      measurement: { id: "m1" },
    });
    const res = await POST(
      jsonRequest(BASE, "POST", { value: 3, variableName: "Vitamin D" }),
    );
    expect(res.status).toBe(201);
    // The route stamps REST provenance when the client names no source.
    expect(recordTrackingMeasurement).toHaveBeenCalledWith(
      { sourceName: "dfda-rest", value: 3, variableName: "Vitamin D" },
      "user-1",
    );
    await expect(res.json()).resolves.toEqual({
      result: { measurement: { id: "m1" } },
    });
  });

  it("maps a core-thrown Error to 400 invalid_argument", async () => {
    vi.mocked(recordTrackingMeasurement).mockRejectedValue(
      new Error("value must be a finite number."),
    );
    const res = await POST(jsonRequest(BASE, "POST", { value: "oops" }));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: {
        code: "invalid_argument",
        message: "value must be a finite number.",
      },
    });
  });

  it("PATCH merges the path id into the core input", async () => {
    vi.mocked(updateMeasurementForUser).mockResolvedValue({
      id: "m1",
      value: 2,
    });
    const res = await PATCH(jsonRequest(`${BASE}/m1`, "PATCH", { value: 2 }), {
      params: Promise.resolve({ id: "m1" }),
    });
    expect(res.status).toBe(200);
    expect(updateMeasurementForUser).toHaveBeenCalledWith(
      { measurementId: "m1", value: 2 },
      "user-1",
    );
    await expect(res.json()).resolves.toEqual({
      measurement: { id: "m1", value: 2 },
    });
  });

  it("DELETE soft-deletes by path id for the session user", async () => {
    vi.mocked(deleteMeasurementForUser).mockResolvedValue({ id: "m1" });
    const res = await DELETE(new Request(`${BASE}/m1`, { method: "DELETE" }), {
      params: Promise.resolve({ id: "m1" }),
    });
    expect(res.status).toBe(200);
    expect(deleteMeasurementForUser).toHaveBeenCalledWith(
      { measurementId: "m1" },
      "user-1",
    );
    await expect(res.json()).resolves.toEqual({ measurement: { id: "m1" } });
  });
});
