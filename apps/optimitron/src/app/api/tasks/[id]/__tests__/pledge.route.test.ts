import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CommerceOfferKind,
  CommerceOfferStatus,
  OrgStatus,
  OrgType,
  TaskFundingTargetStatus,
} from "@optimitron/db";
import { prisma } from "@/lib/prisma";

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  requireAuth: mocks.requireAuth,
}));

import { POST } from "../pledge/route";

const TEST_PREFIX = "tf_pledge_api_";

async function cleanup() {
  await prisma.taskFundingEvent.deleteMany({
    where: { targetId: { startsWith: TEST_PREFIX } },
  });
  await prisma.taskFundingPledge.deleteMany({
    where: { targetId: { startsWith: TEST_PREFIX } },
  });
  await prisma.taskFundingTarget.deleteMany({
    where: { id: { startsWith: TEST_PREFIX } },
  });
  await prisma.task.deleteMany({ where: { id: { startsWith: TEST_PREFIX } } });
  await prisma.organizationMember.deleteMany({
    where: {
      OR: [
        { organizationId: { startsWith: TEST_PREFIX } },
        { userId: { startsWith: TEST_PREFIX } },
      ],
    },
  });
  await prisma.organization.deleteMany({
    where: { id: { startsWith: TEST_PREFIX } },
  });
  await prisma.user.deleteMany({ where: { id: { startsWith: TEST_PREFIX } } });
  await prisma.person.deleteMany({
    where: { id: { startsWith: TEST_PREFIX } },
  });
  await prisma.commerceOfferVariant.deleteMany({
    where: { id: { startsWith: TEST_PREFIX } },
  });
  await prisma.commerceOffer.deleteMany({
    where: { id: { startsWith: TEST_PREFIX } },
  });
}

async function createUserWithPerson(suffix: string, displayName: string) {
  const person = await prisma.person.create({
    data: {
      id: `${TEST_PREFIX}person_${suffix}`,
      displayName,
    },
  });
  const user = await prisma.user.create({
    data: {
      id: `${TEST_PREFIX}user_${suffix}`,
      email: `${TEST_PREFIX}${suffix}@example.test`,
      personId: person.id,
    },
  });

  return { person, user };
}

async function createOrganization(suffix: string, creatorId: string) {
  const org = await prisma.organization.create({
    data: {
      id: `${TEST_PREFIX}org_${suffix}`,
      name: `API Pledge Org ${suffix}`,
      slug: `${TEST_PREFIX}org-${suffix}`,
      type: OrgType.OTHER,
      status: OrgStatus.APPROVED,
      creatorId,
    },
  });
  await prisma.organizationMember.create({
    data: {
      organizationId: org.id,
      role: "OWNER",
      userId: creatorId,
    },
  });
  return org;
}

async function createTaskWithTarget(
  suffix: string,
  targetAmountCents = 10_000n,
) {
  const creator = await createUserWithPerson(`creator_${suffix}`, "Creator");
  const task = await prisma.task.create({
    data: {
      id: `${TEST_PREFIX}task_${suffix}`,
      createdByUserId: creator.user.id,
      title: `API pledge task ${suffix}`,
      description: "A task with a funding target.",
    },
  });
  const target = await prisma.taskFundingTarget.create({
    data: {
      id: `${TEST_PREFIX}target_${suffix}`,
      taskId: task.id,
      targetAmountCents,
      status: TaskFundingTargetStatus.OPEN,
      createdByUserId: creator.user.id,
    },
  });

  return { creator, target, task };
}

async function createTaskWithoutTarget(suffix: string) {
  const creator = await createUserWithPerson(`creator_${suffix}`, "Creator");
  return prisma.task.create({
    data: {
      id: `${TEST_PREFIX}task_${suffix}`,
      createdByUserId: creator.user.id,
      title: `Unfunded API pledge task ${suffix}`,
      description: "A task without a funding target.",
    },
  });
}

async function createOffer(suffix: string, unitAmountCents = 2500) {
  const offer = await prisma.commerceOffer.create({
    data: {
      id: `${TEST_PREFIX}offer_${suffix}`,
      key: `${TEST_PREFIX}${suffix}`,
      kind: CommerceOfferKind.PHYSICAL_GOOD,
      status: CommerceOfferStatus.ACTIVE,
      title: `API ${suffix}`,
      defaultUnitAmountCents: null,
    },
  });
  const variant = await prisma.commerceOfferVariant.create({
    data: {
      id: `${TEST_PREFIX}variant_${suffix}`,
      offerId: offer.id,
      key: `${offer.key}:black-m`,
      variantKey: "black-m",
      label: "Black / M",
      unitAmountCents,
      active: true,
    },
  });

  return { offer, variant };
}

function request(body: unknown) {
  return new Request("http://localhost/api/tasks/task_1/pledge", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

function params(taskId: string) {
  return { params: Promise.resolve({ id: taskId }) };
}

beforeEach(async () => {
  mocks.requireAuth.mockReset();
  await cleanup();
});
afterAll(cleanup);

describe("POST /api/tasks/[id]/pledge", () => {
  it("returns 401 when unauthenticated", async () => {
    mocks.requireAuth.mockRejectedValue(new Error("Unauthorized"));

    const response = await POST(
      request({
        pledgerKind: "PERSON",
        unitKind: "USD",
        amountCents: "1000",
      }),
      params(`${TEST_PREFIX}task_missing`),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 403 when the user cannot pledge for the organization", async () => {
    const { task } = await createTaskWithTarget("forbidden_org");
    const owner = await createUserWithPerson("owner_forbidden", "Owner");
    const outsider = await createUserWithPerson(
      "outsider_forbidden",
      "Outsider",
    );
    const org = await createOrganization("forbidden", owner.user.id);
    mocks.requireAuth.mockResolvedValue({ userId: outsider.user.id });

    const response = await POST(
      request({
        pledgerKind: "ORGANIZATION",
        organizationId: org.id,
        unitKind: "USD",
        amountCents: "1000",
      }),
      params(task.id),
    );

    expect(response.status).toBe(403);
  });

  it("returns 404 when the task has no funding target", async () => {
    const task = await createTaskWithoutTarget("no_target");
    const user = await createUserWithPerson("pledger_no_target", "Pledger");
    mocks.requireAuth.mockResolvedValue({ userId: user.user.id });

    const response = await POST(
      request({
        pledgerKind: "PERSON",
        unitKind: "USD",
        amountCents: "1000",
      }),
      params(task.id),
    );

    expect(response.status).toBe(404);
  });

  it("returns 400 for an invalid payload", async () => {
    const { task } = await createTaskWithTarget("invalid_payload");
    const user = await createUserWithPerson(
      "pledger_invalid_payload",
      "Pledger",
    );
    mocks.requireAuth.mockResolvedValue({ userId: user.user.id });

    const response = await POST(
      request({
        pledgerKind: "PERSON",
        unitKind: "USD",
      }),
      params(task.id),
    );

    expect(response.status).toBe(400);
  });

  it("returns 400 for an invalid amount", async () => {
    const { task } = await createTaskWithTarget("invalid_amount");
    const user = await createUserWithPerson(
      "pledger_invalid_amount",
      "Pledger",
    );
    mocks.requireAuth.mockResolvedValue({ userId: user.user.id });

    const response = await POST(
      request({
        pledgerKind: "PERSON",
        unitKind: "USD",
        amountCents: "0",
      }),
      params(task.id),
    );

    expect(response.status).toBe(400);
  });

  it("returns 409 for a reused idempotency key", async () => {
    const { task } = await createTaskWithTarget("idempotency");
    const user = await createUserWithPerson("pledger_idempotency", "Pledger");
    mocks.requireAuth.mockResolvedValue({ userId: user.user.id });
    const body = {
      pledgerKind: "PERSON",
      unitKind: "USD",
      amountCents: "1000",
      idempotencyKey: `${TEST_PREFIX}idem_duplicate`,
    };

    await POST(request(body), params(task.id));
    const response = await POST(request(body), params(task.id));

    expect(response.status).toBe(409);
  });

  it("records a person USD pledge", async () => {
    const { target, task } = await createTaskWithTarget("person_success");
    const user = await createUserWithPerson(
      "pledger_person_success",
      "Pledger",
    );
    mocks.requireAuth.mockResolvedValue({ userId: user.user.id });

    const response = await POST(
      request({
        pledgerKind: "PERSON",
        unitKind: "USD",
        amountCents: "2500",
      }),
      params(task.id),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.pledge).toMatchObject({
      targetId: target.id,
      pledgerKind: "PERSON",
      unitKey: "usd",
      unitQuantity: "25",
      unitAmountCentsSnapshot: null,
      committedAmountCents: "2500",
      publicDisplay: false,
    });
    expect(json.fundingStatus).toMatchObject({
      targetUsdCents: "10000",
      committedUsdCents: "2500",
      remainingUsdCents: "7500",
      percentToTarget: 25,
      status: "OPEN",
      pledgerCount: 1,
    });
    expect(json.thresholdTransition).toEqual({
      triggered: false,
      thresholdMetAt: null,
    });
  });

  it("records an organization USD pledge", async () => {
    const { task } = await createTaskWithTarget("org_success", 3000n);
    const owner = await createUserWithPerson("owner_success", "Owner");
    const org = await createOrganization("success", owner.user.id);
    mocks.requireAuth.mockResolvedValue({ userId: owner.user.id });

    const response = await POST(
      request({
        pledgerKind: "ORGANIZATION",
        organizationId: org.id,
        publicDisplay: true,
        unitKind: "USD",
        amountCents: "3000",
      }),
      params(task.id),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.pledge).toMatchObject({
      pledgerKind: "ORGANIZATION",
      unitKey: "usd",
      committedAmountCents: "3000",
      publicDisplay: true,
    });
    expect(json.fundingStatus.status).toBe("THRESHOLD_MET");
    expect(json.thresholdTransition.triggered).toBe(true);
    expect(typeof json.thresholdTransition.thresholdMetAt).toBe("string");
  });

  it("records a shirt commerce-offer pledge", async () => {
    const { task } = await createTaskWithTarget("shirt_success");
    const user = await createUserWithPerson("pledger_shirt_success", "Pledger");
    const { offer } = await createOffer("shirt", 2500);
    mocks.requireAuth.mockResolvedValue({ userId: user.user.id });

    const response = await POST(
      request({
        pledgerKind: "PERSON",
        unitKind: "COMMERCE_OFFER",
        offerKey: offer.key,
        variantKey: "black-m",
        quantity: "3",
      }),
      params(task.id),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.pledge).toMatchObject({
      pledgerKind: "PERSON",
      unitKey: `commerce-offer:${offer.key}`,
      unitQuantity: "3",
      unitAmountCentsSnapshot: "2500",
      committedAmountCents: "7500",
    });
    expect(json.fundingStatus.committedUsdCents).toBe("7500");
  });

  it("rejects increment mode", async () => {
    const { task } = await createTaskWithTarget("increment");
    const user = await createUserWithPerson("pledger_increment", "Pledger");
    mocks.requireAuth.mockResolvedValue({ userId: user.user.id });

    const response = await POST(
      request({
        pledgerKind: "PERSON",
        unitKind: "USD",
        amountCents: "1000",
        mode: "increment",
      }),
      params(task.id),
    );

    expect(response.status).toBe(400);
  });
});
