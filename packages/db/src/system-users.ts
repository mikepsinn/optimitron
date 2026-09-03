import { PersonLifeStatus } from "./generated/prisma/client.js";
import {
  WISHONIA_AFFILIATION,
  WISHONIA_DISPLAY_NAME,
  WISHONIA_EMAIL,
  WISHONIA_IMAGE,
  WISHONIA_SOURCE_REF,
  WISHONIA_USERNAME,
} from "./system-identities.js";

export {
  WISHONIA_AFFILIATION,
  WISHONIA_DISPLAY_NAME,
  WISHONIA_EMAIL,
  WISHONIA_IMAGE,
  WISHONIA_SOURCE_REF,
  WISHONIA_USERNAME,
} from "./system-identities.js";

export interface WishoniaUserClient {
  person: {
    upsert(args: unknown): Promise<{ id: string; handle: string | null }>;
  };
  user: {
    findFirst(args: unknown): Promise<{ id: string } | null>;
    update(args: unknown): Promise<{ id: string }>;
    upsert(args: unknown): Promise<{ id: string }>;
  };
}

export async function upsertWishoniaUser(
  client: WishoniaUserClient,
  now = new Date(),
) {
  const person = await client.person.upsert({
    where: { sourceRef: WISHONIA_SOURCE_REF },
    update: {
      deletedAt: null,
      handle: WISHONIA_USERNAME,
      displayName: WISHONIA_DISPLAY_NAME,
      image: WISHONIA_IMAGE,
      bio: "Voice of Optimitron. Alien governance AI. 4,237 years of practice.",
      currentAffiliation: WISHONIA_AFFILIATION,
      isPublic: true,
      isPublicFigure: true,
      lifeStatus: PersonLifeStatus.LIVING,
    },
    create: {
      sourceRef: WISHONIA_SOURCE_REF,
      handle: WISHONIA_USERNAME,
      displayName: WISHONIA_DISPLAY_NAME,
      image: WISHONIA_IMAGE,
      bio: "Voice of Optimitron. Alien governance AI. 4,237 years of practice.",
      currentAffiliation: WISHONIA_AFFILIATION,
      isPublic: true,
      isPublicFigure: true,
      lifeStatus: PersonLifeStatus.LIVING,
    },
  });

  const existingUserForPerson = await client.user.findFirst({
    where: { personId: person.id },
    select: { id: true },
  });

  if (existingUserForPerson) {
    const user = await client.user.update({
      where: { id: existingUserForPerson.id },
      data: {
        email: WISHONIA_EMAIL,
        emailVerified: now,
        isSystem: true,
        person: { connect: { id: person.id } },
      },
    });

    return { person, user };
  }

  // Scalar writes let Prisma use an atomic database upsert during concurrent initialization.
  const user = await client.user.upsert({
    where: { email: WISHONIA_EMAIL },
    update: {
      isSystem: true,
      personId: person.id,
    },
    create: {
      email: WISHONIA_EMAIL,
      isSystem: true,
      emailVerified: now,
      personId: person.id,
    },
  });

  return { person, user };
}
