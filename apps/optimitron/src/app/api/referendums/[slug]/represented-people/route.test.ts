import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const tx = {
    person: { findUnique: vi.fn(), upsert: vi.fn() },
    subject: { upsert: vi.fn() },
    personRelationship: { create: vi.fn() },
    courtCase: { upsert: vi.fn() },
    courtCaseParty: { upsert: vi.fn() },
    referendumVote: { create: vi.fn(), upsert: vi.fn() },
  };
  return {
    tx,
    requireAuth: vi.fn(),
    ensurePersonForUser: vi.fn(),
    transaction: vi.fn(async (work: (client: typeof tx) => Promise<unknown>) => work(tx)),
  };
});

vi.mock("@/lib/auth-utils", () => ({ requireAuth: mocks.requireAuth }));
vi.mock("@/lib/person.server", () => ({ ensurePersonForUser: mocks.ensurePersonForUser }));
vi.mock("@/lib/prisma", () => ({ prisma: { $transaction: mocks.transaction } }));

import { POST } from "./route";

const treatyContext = { params: Promise.resolve({ slug: "one-percent-treaty" }) };

function submission(overrides: Record<string, unknown> = {}) {
  return new Request("https://optimitron.com/api/referendums/one-percent-treaty/represented-people", {
    method: "POST",
    body: JSON.stringify({
      firstName: "Test", lastName: "Child", lifeStatus: "LIVING",
      authorityConfirmed: true, isPublic: false,
      clientDraftId: "saved-offline-draft", ...overrides,
    }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAuth.mockResolvedValue({ userId: "authenticated-user" });
  mocks.ensurePersonForUser.mockResolvedValue({ id: "caster-person" });
  mocks.tx.person.findUnique.mockResolvedValue(null);
  mocks.tx.person.upsert.mockResolvedValue({ id: "represented-person", displayName: "Test Child", isPublic: false });
  mocks.tx.subject.upsert.mockResolvedValue({ id: "represented-subject" });
  mocks.tx.courtCase.upsert.mockResolvedValue({ id: "humanity-case" });
  mocks.tx.courtCaseParty.upsert.mockResolvedValue({ id: "plaintiff-party" });
});

describe("treaty representation and retired Court writes", () => {
  it("keeps treaty registration and draft attribution local without casting a proxy vote", async () => {
    const response = await POST(submission({ userId: "spoofed-user" }), treatyContext);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      person: { id: "represented-person" }, party: { id: "plaintiff-party" },
    });
    expect(mocks.tx.person.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { sourceRef: "represented-person-draft:authenticated-user:saved-offline-draft" },
      create: expect.objectContaining({ createdByUserId: "authenticated-user", isPublic: false }),
    }));
    expect(mocks.tx.courtCaseParty.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ createdByUserId: "authenticated-user", subjectId: "represented-subject", isPublic: false }),
    }));
    expect(mocks.tx.referendumVote.create).not.toHaveBeenCalled();
    expect(mocks.tx.referendumVote.upsert).not.toHaveBeenCalled();
  });

  it("requires authentication before accepting a treaty draft", async () => {
    mocks.requireAuth.mockRejectedValue(new Error("Unauthorized"));
    expect((await POST(submission(), treatyContext)).status).toBe(401);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("keeps the authority acknowledgement requirement on the treaty endpoint", async () => {
    expect((await POST(submission({ authorityConfirmed: false }), treatyContext)).status).toBe(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("returns 410 and the Court destination for POST", async () => {
    const response = await POST(new Request("https://optimitron.com/api/legacy", { method: "POST", body: "invalid JSON" }), { params: Promise.resolve({ slug: "record-1" }) });
    expect(response.status).toBe(410);
    expect(await response.json()).toMatchObject({ code: "COURT_ENDPOINT_MOVED", endpoint: "https://courtofhumanity.org/api/referendums/record-1/represented-people" });
    expect(mocks.requireAuth).not.toHaveBeenCalled();
  });
});
