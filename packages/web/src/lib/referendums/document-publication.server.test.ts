import { ReferendumKind } from "@optimitron/db";
import { sha256CanonicalJson } from "@optimitron/data/parameters";
import { describe, expect, it, vi } from "vitest";
import {
  buildImmutableReferendumContentHash,
  publishDocumentRevisionAsReferendum,
} from "./document-publication.server";

async function buildFixture() {
  const decision = {
    acceptedReviewArtifactIds: ["review_artifact_1"],
    adoptedDocument: {
      contentHash: "sha256:document",
      documentId: "document_1",
      revisionId: "revision_3",
      version: 3,
    },
    authorityTaskId: "authority_task_1",
    decidedAt: "2026-07-20T12:00:00.000Z",
    decidedByUserId: "manager_1",
    schema: "optimitron.document-decision.v1" as const,
    waivers: [],
  };
  const decisionContentHash = await sha256CanonicalJson(decision);
  const decisionArtifact = {
    contentHash: decisionContentHash,
    id: "decision_artifact_1",
    metadataJson: { kind: "document-decision" },
    structuredResultJson: decision,
    submittedByUserId: "manager_1",
    taskExecutionAttempt: {
      id: "attempt_1",
      taskId: "authority_task_1",
    },
  };
  const revision = {
    body: "# Adopted policy\n\nExact body.\n",
    contentHash: "sha256:document",
    document: {
      currentRevisionId: "revision_3",
      jurisdictionId: "jurisdiction_1",
    },
    documentId: "document_1",
    id: "revision_3",
    title: "Adopted policy",
    version: 3,
  };
  const artifacts = new Map<string, Record<string, unknown>>();
  const referendums: Array<Record<string, unknown>> = [];
  const tx = {
    documentRevision: {
      findFirst: vi.fn(async () => revision),
    },
    referendum: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const referendum = {
          id: `referendum_${referendums.length + 1}`,
          ...data,
        };
        referendums.push(referendum);
        return referendum;
      }),
    },
    taskExecutionArtifact: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        artifacts.set(data.id as string, { ...data });
        return { id: data.id };
      }),
      findFirst: vi.fn(async () => decisionArtifact),
      findUnique: vi.fn(
        async ({ where }: { where: { id: string } }) =>
          artifacts.get(where.id) ?? null,
      ),
    },
  };
  const db = {
    $transaction: async <T>(callback: (client: typeof tx) => Promise<T>) =>
      callback(tx),
    taskExecutionArtifact: {
      findFirst: vi.fn(async () => ({ structuredResultJson: decision })),
    },
    task: {
      findFirst: vi.fn(
        async (): Promise<{ id: string } | null> => ({
          id: "authority_task_1",
        }),
      ),
    },
  };

  return {
    artifacts,
    db,
    decision,
    decisionArtifact,
    referendums,
    revision,
    tx,
  };
}

describe("publishDocumentRevisionAsReferendum", () => {
  it("copies the exact adopted body into a locked referendum and records provenance", async () => {
    const fixture = await buildFixture();
    const now = new Date("2026-07-22T12:00:00.000Z");
    const input = {
      decisionArtifactId: "decision_artifact_1",
      description: "Vote on the adopted policy.",
      kind: ReferendumKind.GENERAL,
      question: "Should this adopted policy take effect?",
      slug: "adopted-policy",
    };
    const options = {
      canManageTask: vi.fn(async () => true),
      db: fixture.db as never,
      now,
    };

    const first = await publishDocumentRevisionAsReferendum(
      input,
      "manager_1",
      options,
    );
    const second = await publishDocumentRevisionAsReferendum(
      input,
      "manager_1",
      options,
    );

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.publicationArtifactId).toBe(first.publicationArtifactId);
    expect(fixture.referendums).toHaveLength(1);
    expect(fixture.referendums[0]).toMatchObject({
      bodyMarkdown: fixture.revision.body,
      contentHash: buildImmutableReferendumContentHash({
        bodyMarkdown: fixture.revision.body,
        description: input.description,
        question: input.question,
      }),
      jurisdictionId: "jurisdiction_1",
      lockedAt: now,
      publishedAt: now,
      status: "ACTIVE",
      title: fixture.revision.title,
    });
    expect(first.publication).toMatchObject({
      decisionArtifact: {
        contentHash: fixture.decisionArtifact.contentHash,
        id: fixture.decisionArtifact.id,
      },
      document: {
        contentHash: fixture.revision.contentHash,
        revisionId: fixture.revision.id,
      },
      referendum: {
        id: "referendum_1",
        status: "ACTIVE",
      },
      schema: "optimitron.document-publication.v1",
    });
    expect(fixture.artifacts.size).toBe(1);
  });

  it("publishes the exact adopted revision after a later unadopted draft becomes current", async () => {
    const fixture = await buildFixture();
    fixture.revision.document.currentRevisionId = "revision_4";

    const published = await publishDocumentRevisionAsReferendum(
      {
        decisionArtifactId: "decision_artifact_1",
        kind: ReferendumKind.GENERAL,
        question: "Should the adopted v3 policy take effect?",
        slug: "adopted-policy-v3",
      },
      "manager_1",
      {
        canManageTask: vi.fn(async () => true),
        db: fixture.db as never,
      },
    );

    expect(published.publication.document).toMatchObject({
      contentHash: "sha256:document",
      revisionId: "revision_3",
      version: 3,
    });
    expect(fixture.referendums).toHaveLength(1);
    expect(fixture.referendums[0]).toMatchObject({
      bodyMarkdown: fixture.revision.body,
      title: fixture.revision.title,
    });
  });

  it("publishes a separately adopted later revision as a separate referendum", async () => {
    const fixture = await buildFixture();
    fixture.revision.document.currentRevisionId = "revision_4";
    const options = {
      canManageTask: vi.fn(async () => true),
      db: fixture.db as never,
    };

    const first = await publishDocumentRevisionAsReferendum(
      {
        decisionArtifactId: "decision_artifact_1",
        question: "Should the adopted v3 policy take effect?",
        slug: "adopted-policy-v3",
      },
      "manager_1",
      options,
    );

    fixture.decision.adoptedDocument.contentHash = "sha256:document-v4";
    fixture.decision.adoptedDocument.revisionId = "revision_4";
    fixture.decision.adoptedDocument.version = 4;
    fixture.decision.decidedAt = "2026-07-23T12:00:00.000Z";
    fixture.decisionArtifact.contentHash = await sha256CanonicalJson(
      fixture.decision,
    );
    fixture.decisionArtifact.id = "decision_artifact_2";
    fixture.decisionArtifact.taskExecutionAttempt.id = "attempt_2";
    fixture.revision.body = "# Adopted policy v4\n\nRevised exact body.\n";
    fixture.revision.contentHash = "sha256:document-v4";
    fixture.revision.id = "revision_4";
    fixture.revision.title = "Adopted policy v4";
    fixture.revision.version = 4;

    const second = await publishDocumentRevisionAsReferendum(
      {
        decisionArtifactId: "decision_artifact_2",
        question: "Should the adopted v4 policy take effect?",
        slug: "adopted-policy-v4",
      },
      "manager_1",
      options,
    );

    expect(first.publicationArtifactId).not.toBe(second.publicationArtifactId);
    expect(first.referendumId).not.toBe(second.referendumId);
    expect(fixture.referendums).toHaveLength(2);
    expect(
      fixture.referendums.map((referendum) => referendum.bodyMarkdown),
    ).toEqual([
      "# Adopted policy\n\nExact body.\n",
      "# Adopted policy v4\n\nRevised exact body.\n",
    ]);
  });

  it("does not expose a decision to a caller who cannot manage its authority task", async () => {
    const fixture = await buildFixture();

    await expect(
      publishDocumentRevisionAsReferendum(
        {
          decisionArtifactId: "decision_artifact_1",
          question: "Should this adopted policy take effect?",
          slug: "adopted-policy",
        },
        "outsider_1",
        {
          canManageTask: vi.fn(async () => false),
          db: fixture.db as never,
        },
      ),
    ).rejects.toThrow("Document decision not found");
    expect(fixture.tx.taskExecutionArtifact.findFirst).not.toHaveBeenCalled();
  });

  it("enforces the OAuth client boundary on the authority task", async () => {
    const fixture = await buildFixture();
    fixture.db.task.findFirst.mockResolvedValueOnce(null);

    await expect(
      publishDocumentRevisionAsReferendum(
        {
          decisionArtifactId: "decision_artifact_1",
          question: "Should this adopted policy take effect?",
          slug: "adopted-policy",
        },
        "manager_1",
        {
          canManageTask: vi.fn(async () => true),
          clientAccessBoundary: {
            allowPersonalPrivate: false,
            organizationIds: ["different_org"],
          },
          db: fixture.db as never,
        },
      ),
    ).rejects.toThrow("Document decision not found");
    expect(fixture.db.task.findFirst).toHaveBeenCalledWith({
      where: expect.objectContaining({ id: "authority_task_1" }),
      select: { id: true },
    });
    expect(fixture.referendums).toHaveLength(0);
  });
});
