import { SourceArtifactType } from "@optimitron/db/enums";
import { describe, expect, it } from "vitest";
import {
  assertCalculationSourceArtifactIsImmutable,
  CALCULATION_SOURCE_SCHEMA_VERSION,
  prepareSourceArtifactContent,
} from "./source-artifacts";

describe("calculation source artifacts", () => {
  it("stores arbitrary calculation code as inert content-addressed data", async () => {
    const prepared = await prepareSourceArtifactContent({
      artifactType: SourceArtifactType.CALCULATION_SOURCE,
      contentHash: null,
      payloadJson: {
        language: "python",
        source: "print(6 * 7)",
      },
    });

    expect(prepared.contentHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(prepared.payloadJson).toMatchObject({
      executionPolicy: "inert",
      language: "python",
      schemaVersion: CALCULATION_SOURCE_SCHEMA_VERSION,
      source: "print(6 * 7)",
    });
  });

  it("rejects a false hash and mutation under the same source key", async () => {
    await expect(
      prepareSourceArtifactContent({
        artifactType: SourceArtifactType.CALCULATION_SOURCE,
        contentHash: "not-the-content-hash",
        payloadJson: { language: "python", source: "print(42)" },
      }),
    ).rejects.toThrow("does not match");

    expect(() =>
      assertCalculationSourceArtifactIsImmutable(
        {
          artifactType: SourceArtifactType.CALCULATION_SOURCE,
          contentHash: "old-hash",
        },
        {
          artifactType: SourceArtifactType.CALCULATION_SOURCE,
          contentHash: "new-hash",
        },
      ),
    ).toThrow("immutable");
  });
});
