import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { resolveTaskReferenceLinks } from "@/lib/tasks/task-reference-links.server";

const TEST_PREFIX = "task_reference_links_";
const PUBLIC_TASK_ID = "cautolinkpublic0000000000";
const PRIVATE_TASK_ID = "cautolinkprivate000000000";
const OWN_TASK_ID = "cautolinkowned00000000000";

async function cleanup() {
  await prisma.task.deleteMany({
    where: { createdByUserId: { startsWith: TEST_PREFIX } },
  });
  await prisma.user.deleteMany({ where: { id: { startsWith: TEST_PREFIX } } });
  await prisma.person.deleteMany({
    where: { id: { startsWith: TEST_PREFIX } },
  });
}

async function createUser(suffix: string) {
  const person = await prisma.person.create({
    data: {
      displayName: `Task reference ${suffix}`,
      id: `${TEST_PREFIX}person_${suffix}`,
    },
  });
  const user = await prisma.user.create({
    data: {
      email: `${TEST_PREFIX}${suffix}@example.test`,
      id: `${TEST_PREFIX}user_${suffix}`,
      personId: person.id,
    },
  });
  return { person, user };
}

describe.sequential("resolveTaskReferenceLinks", () => {
  beforeEach(cleanup);
  afterAll(cleanup);

  it("returns titles only for tasks the viewer can access", async () => {
    const viewer = await createUser("viewer");
    const other = await createUser("other");
    await prisma.task.createMany({
      data: [
        {
          createdByUserId: other.user.id,
          description: "Public task.",
          id: PUBLIC_TASK_ID,
          isPublic: true,
          title: "Public task title",
        },
        {
          createdByUserId: other.user.id,
          description: "Private task.",
          id: PRIVATE_TASK_ID,
          isPublic: false,
          title: "Private task title",
        },
        {
          createdByUserId: viewer.user.id,
          description: "Viewer-owned task.",
          id: OWN_TASK_ID,
          isPublic: false,
          title: "Viewer task title",
        },
      ],
    });
    const markdown = `${PRIVATE_TASK_ID} ${PUBLIC_TASK_ID} ${OWN_TASK_ID}`;

    await expect(
      resolveTaskReferenceLinks({
        markdown,
        personId: viewer.person.id,
        userId: viewer.user.id,
      }),
    ).resolves.toEqual([
      {
        href: `/tasks/${PUBLIC_TASK_ID}`,
        id: PUBLIC_TASK_ID,
        title: "Public task title",
      },
      {
        href: `/tasks/${OWN_TASK_ID}`,
        id: OWN_TASK_ID,
        title: "Viewer task title",
      },
    ]);

    await expect(
      resolveTaskReferenceLinks({ markdown, userId: null }),
    ).resolves.toEqual([
      {
        href: `/tasks/${PUBLIC_TASK_ID}`,
        id: PUBLIC_TASK_ID,
        title: "Public task title",
      },
    ]);
  });
});
