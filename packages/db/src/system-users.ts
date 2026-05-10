import { PersonLifeStatus } from "./generated/prisma/client.js";

export const WISHONIA_EMAIL = "wishonia@gmail.com";
export const WISHONIA_USERNAME = "wishonia";
export const WISHONIA_DISPLAY_NAME = "Wishonia";
export const WISHONIA_AFFILIATION =
  "World Integrated System for High-Efficiency Optimization Networked Intelligence for Allocation";
export const WISHONIA_IMAGE = "/sprites/wishonia/smirk-smile.png";
export const WISHONIA_SOURCE_REF = "wishonia:system";

export interface WishoniaUserClient {
  person: {
    upsert(args: unknown): Promise<{ id: string; handle: string | null }>;
  };
  user: {
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

  const user = await client.user.upsert({
    where: { email: WISHONIA_EMAIL },
    update: {
      isSystem: true,
      person: { connect: { id: person.id } },
    },
    create: {
      email: WISHONIA_EMAIL,
      isSystem: true,
      emailVerified: now,
      person: { connect: { id: person.id } },
    },
  });

  return { person, user };
}
