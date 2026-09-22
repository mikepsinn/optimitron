// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  referendum: vi.fn(),
  vote: vi.fn(),
  person: vi.fn(),
  enroll: vi.fn(),
  subject: vi.fn(),
}));
vi.mock("@/lib/auth-utils", () => ({ requireAuth: mocks.requireAuth }));
vi.mock("@/lib/person.server", () => ({ ensurePersonForUser: mocks.person }));
vi.mock("@/lib/subject.server", () => ({
  ensureSubjectForPerson: mocks.subject,
}));
vi.mock("@/lib/humanity-v-government-case.server", () => ({
  ensureHumanityVGovernmentPlaintiffParty: mocks.enroll,
}));
vi.mock("@/lib/referral.server", () => ({
  findUserByHandleOrReferralCode: async () => null,
}));
vi.mock("@/lib/logger", () => ({ createLogger: () => ({ error() {} }) }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    referendum: { findFirst: mocks.referendum },
    referendumVote: { upsert: mocks.vote },
    person: {
      findUnique: async () => ({ displayName: "Plaintiff", isPublic: false }),
      update: async () => ({}),
    },
    activity: { create: async () => ({}) },
    $transaction: async (fn: (tx: object) => unknown) =>
      fn({
        referendumVote: { upsert: mocks.vote },
        person: { update: async () => ({}) },
      }),
  },
}));
import { POST } from "./route";
const slug = "court-humanity-v-government-verdict";
function vote(answer: string, target = slug) {
  return POST(
    new Request(`https://courtofhumanity.org/api/referendums/${target}/vote`, {
      method: "POST",
      body: JSON.stringify({ answer }),
    }),
    { params: Promise.resolve({ slug: target }) },
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.enroll.mockResolvedValue({ id: "party-1" });
  mocks.requireAuth.mockResolvedValue({ userId: "user-1" });
  mocks.person.mockResolvedValue({
    id: "person-1",
    displayName: "Plaintiff",
    isPublic: false,
  });
  mocks.subject.mockResolvedValue({ id: "subject-1" });
  mocks.referendum.mockResolvedValue({ id: "ref-1", slug, status: "ACTIVE" });
  mocks.vote.mockImplementation(async ({ create }) => ({
    id: "vote-1",
    ...create,
  }));
});
describe("Court-owned verdict votes", () => {
  it("reports an enrollment failure instead of returning a successful vote", async () => {
    mocks.enroll.mockRejectedValue(
      new Error("Private party belongs to another account"),
    );
    expect((await vote("YES")).status).toBe(500);
  });
  it("enrolls YES verdict voters and preserves private plaintiff visibility", async () => {
    const response = await vote("yes");
    expect(response.status).toBe(200);
    expect((await response.json()).vote.answer).toBe("YES");
    expect(mocks.enroll).toHaveBeenCalledWith(expect.anything(), {
      createdByUserId: "user-1",
      displayName: "Plaintiff",
      isPublic: false,
      subjectId: "subject-1",
    });
  });
  it.each(["NO", "ABSTAIN"])("does not enroll %s voters", async (answer) => {
    expect((await vote(answer)).status).toBe(200);
    expect(mocks.enroll).not.toHaveBeenCalled();
  });
  it("leaves treaty votes with the campaign owner", async () => {
    mocks.referendum.mockResolvedValue(null);
    expect((await vote("YES", "one-percent-treaty")).status).toBe(404);
    expect(mocks.vote).not.toHaveBeenCalled();
  });
  it("requires a Court session", async () => {
    mocks.requireAuth.mockRejectedValue(new Error("Unauthorized"));
    expect((await vote("YES")).status).toBe(401);
    expect(mocks.vote).not.toHaveBeenCalled();
  });
});
