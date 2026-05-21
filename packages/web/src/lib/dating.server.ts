import {
  DatingInteractionKind,
  DatingInteractionStatus,
  DatingMatchStatus,
  DatingProfilePhotoStatus,
  DatingProfileStatus,
  DatingQuestionAnswerVisibility,
  DatingQuestionImportance,
  DatingQuestionStatus,
  DatingRelationshipIntent,
  Prisma,
} from "@optimitron/db";
import { prisma } from "@/lib/prisma";

function buildProfileSelect(options?: { publicPhotosOnly?: boolean }) {
  const photoWhere: Prisma.DatingProfilePhotoWhereInput = {
    deletedAt: null,
    ...(options?.publicPhotosOnly
      ? { status: DatingProfilePhotoStatus.APPROVED }
      : {}),
  };

  return {
    id: true,
    userId: true,
    status: true,
    headline: true,
    bio: true,
    lookingForText: true,
    relationshipIntents: true,
    displayCity: true,
    displayRegionCode: true,
    displayCountryCode: true,
    wantsCampaignDates: true,
    campaignDateIdeas: true,
    photos: {
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        altText: true,
        id: true,
        imageUrl: true,
        status: true,
      },
      where: photoWhere,
    },
    user: {
      select: {
        email: true,
        id: true,
        person: {
          select: {
            displayName: true,
            id: true,
            image: true,
          },
        },
      },
    },
  } satisfies Prisma.DatingProfileSelect;
}

const ownProfileSelect = buildProfileSelect();
const publicProfileSelect = buildProfileSelect({ publicPhotosOnly: true });

export interface DatingProfileView {
  id: string;
  userId: string;
  status: DatingProfileStatus;
  headline: string | null;
  bio: string | null;
  lookingForText: string | null;
  relationshipIntents: DatingRelationshipIntent[];
  displayCity: string | null;
  displayRegionCode: string | null;
  displayCountryCode: string | null;
  wantsCampaignDates: boolean;
  campaignDateIdeas: string[];
  photos: Array<{
    altText: string | null;
    id: string;
    imageUrl: string;
    status: DatingProfilePhotoStatus;
  }>;
  user: {
    email: string;
    id: string;
    person: {
      displayName: string;
      image: string | null;
    } | null;
  };
}

export interface DatingProfileInput {
  bio?: string | null;
  campaignDateIdeas?: string[];
  displayCity?: string | null;
  displayCountryCode?: string | null;
  displayRegionCode?: string | null;
  headline?: string | null;
  lookingForText?: string | null;
  relationshipIntents?: DatingRelationshipIntent[];
  status?: DatingProfileStatus;
  wantsCampaignDates?: boolean;
}

function cleanText(value: string | null | undefined, maxLength: number) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

function cleanStringList(values: string[] | undefined, maxItems: number) {
  return (values ?? [])
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, maxItems);
}

function canonicalProfilePair(profileAId: string, profileBId: string) {
  return [profileAId, profileBId].sort() as [string, string];
}

export async function getOwnDatingProfile(
  userId: string,
): Promise<DatingProfileView | null> {
  return prisma.datingProfile.findFirst({
    select: ownProfileSelect,
    where: {
      deletedAt: null,
      userId,
    },
  });
}

export async function saveDatingProfile(
  userId: string,
  input: DatingProfileInput,
) {
  const now = new Date();
  const update = {
    bio: cleanText(input.bio, 2000),
    campaignDateIdeas: cleanStringList(input.campaignDateIdeas, 8),
    displayCity: cleanText(input.displayCity, 80),
    displayCountryCode: cleanText(input.displayCountryCode, 2)?.toUpperCase() ?? null,
    displayRegionCode: cleanText(input.displayRegionCode, 16)?.toUpperCase() ?? null,
    headline: cleanText(input.headline, 140),
    lastActiveAt: now,
    lookingForText: cleanText(input.lookingForText, 1000),
    profileCompletedAt: now,
    relationshipIntents: input.relationshipIntents ?? [],
    status: input.status ?? DatingProfileStatus.ACTIVE,
    wantsCampaignDates: input.wantsCampaignDates ?? true,
  };

  return prisma.datingProfile.upsert({
    create: {
      ...update,
      userId,
    },
    select: ownProfileSelect,
    update,
    where: { userId },
  });
}

async function requireOwnDatingProfile(userId: string) {
  const profile = await prisma.datingProfile.findFirst({
    where: {
      deletedAt: null,
      userId,
    },
  });

  if (!profile) {
    throw new Error("Create a dating profile first.");
  }

  return profile;
}

export async function addDatingProfilePhoto(
  userId: string,
  input: { altText?: string | null; imageUrl: string },
) {
  const profile = await requireOwnDatingProfile(userId);
  const sortOrder = await prisma.datingProfilePhoto.count({
    where: {
      deletedAt: null,
      profileId: profile.id,
    },
  });

  return prisma.datingProfilePhoto.create({
    data: {
      altText: cleanText(input.altText, 200),
      imageUrl: input.imageUrl.trim(),
      profileId: profile.id,
      sortOrder,
      status: DatingProfilePhotoStatus.PENDING,
    },
  });
}

export async function getDatingQuestionsData(userId: string) {
  const profile = await requireOwnDatingProfile(userId);
  const questions = await prisma.datingQuestion.findMany({
    include: {
      answers: {
        where: {
          deletedAt: null,
          profileId: profile.id,
        },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { text: "asc" }],
    where: {
      deletedAt: null,
      status: DatingQuestionStatus.ACTIVE,
    },
  });

  return { profile, questions };
}

export async function answerDatingQuestion(
  userId: string,
  input: {
    acceptableValues?: unknown;
    answerValues: unknown;
    explanation?: string | null;
    importance?: DatingQuestionImportance;
    questionId: string;
  },
) {
  const profile = await requireOwnDatingProfile(userId);

  return prisma.datingQuestionAnswer.upsert({
    create: {
      acceptableValues:
        input.acceptableValues === undefined
          ? Prisma.JsonNull
          : (input.acceptableValues as Prisma.InputJsonValue),
      answerValues: input.answerValues as Prisma.InputJsonValue,
      explanation: cleanText(input.explanation, 1000),
      importance: input.importance ?? DatingQuestionImportance.SOMEWHAT,
      profileId: profile.id,
      questionId: input.questionId,
      visibility: DatingQuestionAnswerVisibility.PUBLIC,
    },
    update: {
      acceptableValues:
        input.acceptableValues === undefined
          ? Prisma.JsonNull
          : (input.acceptableValues as Prisma.InputJsonValue),
      answerValues: input.answerValues as Prisma.InputJsonValue,
      answeredAt: new Date(),
      explanation: cleanText(input.explanation, 1000),
      importance: input.importance ?? DatingQuestionImportance.SOMEWHAT,
      visibility: DatingQuestionAnswerVisibility.PUBLIC,
    },
    where: {
      profileId_questionId: {
        profileId: profile.id,
        questionId: input.questionId,
      },
    },
  });
}

export async function getDatingDiscoverData(userId: string) {
  const profile = await getOwnDatingProfile(userId);
  const candidates = await prisma.datingProfile.findMany({
    select: publicProfileSelect,
    orderBy: [{ lastActiveAt: "desc" }, { createdAt: "desc" }],
    take: 24,
    where: {
      deletedAt: null,
      status: DatingProfileStatus.ACTIVE,
      ...(profile ? { id: { not: profile.id } } : {}),
    },
  });

  return { candidates, profile };
}

export async function createDatingInteraction(
  userId: string,
  input: {
    introMessage?: string | null;
    kind: DatingInteractionKind;
    toProfileId: string;
  },
) {
  const fromProfile = await requireOwnDatingProfile(userId);

  if (fromProfile.id === input.toProfileId) {
    throw new Error("You cannot match yourself.");
  }

  const toProfile = await prisma.datingProfile.findFirst({
    where: {
      deletedAt: null,
      id: input.toProfileId,
      status: DatingProfileStatus.ACTIVE,
    },
  });

  if (!toProfile) {
    throw new Error("Dating profile not found.");
  }

  return prisma.$transaction(async (tx) => {
    const interaction = await tx.datingInteraction.create({
      data: {
        fromProfileId: fromProfile.id,
        introMessage: cleanText(input.introMessage, 500),
        kind: input.kind,
        status: DatingInteractionStatus.ACTIVE,
        toProfileId: toProfile.id,
      },
    });

    if (input.kind === DatingInteractionKind.PASS) {
      return { conversation: null, interaction, match: null };
    }

    const reciprocal = await tx.datingInteraction.findFirst({
      orderBy: { createdAt: "desc" },
      where: {
        deletedAt: null,
        fromProfileId: toProfile.id,
        kind: {
          in: [
            DatingInteractionKind.INTRO,
            DatingInteractionKind.LIKE,
            DatingInteractionKind.SUPERLIKE,
          ],
        },
        status: DatingInteractionStatus.ACTIVE,
        toProfileId: fromProfile.id,
      },
    });

    if (!reciprocal) {
      return { conversation: null, interaction, match: null };
    }

    const [profileAId, profileBId] = canonicalProfilePair(
      fromProfile.id,
      toProfile.id,
    );
    const match = await tx.datingMatch.upsert({
      create: {
        profileAId,
        profileBId,
        status: DatingMatchStatus.ACTIVE,
      },
      update: {
        status: DatingMatchStatus.ACTIVE,
        unmatchedAt: null,
      },
      where: {
        profileAId_profileBId: {
          profileAId,
          profileBId,
        },
      },
    });
    const conversation = await tx.datingConversation.upsert({
      create: { matchId: match.id },
      update: {},
      where: { matchId: match.id },
    });

    return { conversation, interaction, match };
  });
}

export async function getDatingMatchesData(userId: string) {
  const profile = await requireOwnDatingProfile(userId);
  const matches = await prisma.datingMatch.findMany({
    include: {
      conversation: {
        select: {
          id: true,
          messages: {
            orderBy: { createdAt: "desc" },
            select: {
              body: true,
              id: true,
            },
            take: 1,
          },
        },
      },
      profileA: {
        select: publicProfileSelect,
      },
      profileB: {
        select: publicProfileSelect,
      },
    },
    orderBy: [{ lastMessageAt: "desc" }, { matchedAt: "desc" }],
    where: {
      deletedAt: null,
      OR: [{ profileAId: profile.id }, { profileBId: profile.id }],
      status: DatingMatchStatus.ACTIVE,
    },
  });

  return { matches, profile };
}

export async function getDatingConversationData(
  userId: string,
  conversationId: string,
) {
  const profile = await requireOwnDatingProfile(userId);
  const conversation = await prisma.datingConversation.findFirst({
    include: {
      datePlans: {
        orderBy: { createdAt: "desc" },
        where: { deletedAt: null },
      },
      match: {
        select: {
          id: true,
          profileAId: true,
          profileBId: true,
          profileA: {
            select: publicProfileSelect,
          },
          profileB: {
            select: publicProfileSelect,
          },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        where: { deletedAt: null },
      },
    },
    where: {
      deletedAt: null,
      id: conversationId,
      match: {
        OR: [{ profileAId: profile.id }, { profileBId: profile.id }],
      },
    },
  });

  return { conversation, profile };
}

export async function sendDatingMessage(
  userId: string,
  input: { body: string; conversationId: string },
) {
  const { conversation, profile } = await getDatingConversationData(
    userId,
    input.conversationId,
  );

  if (!conversation) {
    throw new Error("Conversation not found.");
  }

  const message = await prisma.datingMessage.create({
    data: {
      body: input.body.trim().slice(0, 4000),
      conversationId: conversation.id,
      senderProfileId: profile.id,
    },
  });

  await prisma.datingMatch.update({
    data: { lastMessageAt: new Date() },
    where: { id: conversation.matchId },
  });

  return message;
}

export async function proposeDatingDatePlan(
  userId: string,
  input: {
    campaignNotes?: string | null;
    campaignTaskId?: string | null;
    conversationId?: string | null;
    isCampaignDate?: boolean;
    locationName?: string | null;
    matchId: string;
    startsAt?: Date | null;
    title: string;
  },
) {
  const profile = await requireOwnDatingProfile(userId);
  const match = await prisma.datingMatch.findFirst({
    where: {
      deletedAt: null,
      id: input.matchId,
      OR: [{ profileAId: profile.id }, { profileBId: profile.id }],
    },
  });

  if (!match) {
    throw new Error("Match not found.");
  }

  return prisma.datingDatePlan.create({
    data: {
      campaignNotes: cleanText(input.campaignNotes, 1000),
      campaignTaskId: cleanText(input.campaignTaskId, 120),
      conversationId: cleanText(input.conversationId, 120),
      isCampaignDate: input.isCampaignDate ?? false,
      locationName: cleanText(input.locationName, 200),
      matchId: match.id,
      proposedByProfileId: profile.id,
      startsAt: input.startsAt ?? null,
      title: cleanText(input.title, 140) ?? "Mission date",
    },
  });
}

export async function createDatingSafetyReport(
  userId: string,
  input: {
    datePlanId?: string | null;
    description?: string | null;
    messageId?: string | null;
    reason: string;
    reportedProfileId?: string | null;
  },
) {
  const profile = await requireOwnDatingProfile(userId);

  return prisma.datingSafetyReport.create({
    data: {
      datePlanId: cleanText(input.datePlanId, 120),
      description: cleanText(input.description, 2000),
      messageId: cleanText(input.messageId, 120),
      reason: cleanText(input.reason, 200) ?? "Report",
      reportedProfileId: cleanText(input.reportedProfileId, 120),
      reporterProfileId: profile.id,
    },
  });
}
