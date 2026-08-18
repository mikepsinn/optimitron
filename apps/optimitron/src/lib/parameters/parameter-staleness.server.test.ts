import { describe, expect, it, vi } from "vitest";
import { getTransitiveStaleParameterRevisionIds } from "./parameter-staleness.server";

describe("getTransitiveStaleParameterRevisionIds", () => {
  it("marks a calculated revision stale when a transitive input is superseded", async () => {
    const rows = new Map([
      [
        "output-v1",
        {
          id: "output-v1",
          inputs: [{ inputRevisionId: "input-v1" }],
          parameter: { currentRevisionId: "output-v1", deletedAt: null },
        },
      ],
      [
        "input-v1",
        {
          id: "input-v1",
          inputs: [],
          parameter: { currentRevisionId: "input-v2", deletedAt: null },
        },
      ],
    ]);
    const db = {
      parameterRevision: {
        findMany: vi.fn(({ where }) =>
          where.id.in.flatMap((id: string) => {
            const row = rows.get(id);
            return row ? [row] : [];
          }),
        ),
      },
    };

    await expect(
      getTransitiveStaleParameterRevisionIds(["output-v1"], db as never),
    ).resolves.toEqual(new Set(["output-v1"]));
  });

  it("keeps a fully current dependency chain usable", async () => {
    const rows = new Map([
      [
        "output-v1",
        {
          id: "output-v1",
          inputs: [{ inputRevisionId: "input-v1" }],
          parameter: { currentRevisionId: "output-v1", deletedAt: null },
        },
      ],
      [
        "input-v1",
        {
          id: "input-v1",
          inputs: [],
          parameter: { currentRevisionId: "input-v1", deletedAt: null },
        },
      ],
    ]);
    const db = {
      parameterRevision: {
        findMany: vi.fn(({ where }) =>
          where.id.in.flatMap((id: string) => {
            const row = rows.get(id);
            return row ? [row] : [];
          }),
        ),
      },
    };

    await expect(
      getTransitiveStaleParameterRevisionIds(["output-v1"], db as never),
    ).resolves.toEqual(new Set());
  });
});
