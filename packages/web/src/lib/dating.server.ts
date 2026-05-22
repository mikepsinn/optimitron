import { Prisma } from "@optimitron/db";
import {
  DatingBlockScope,
  DatingConversationStatus,
  DatingInteractionKind,
  DatingInteractionStatus,
  DatingMatchStatus,
  DatingProfilePhotoStatus,
  DatingProfileStatus,
  DatingQuestionAnswerVisibility,
  DatingQuestionImportance,
  DatingQuestionStatus,
  DatingRelationshipIntent,
} from "@optimitron/db/enums";
import {
  hasDatingSafetyAcknowledgement,
  withDatingSafetyAcknowledgement,
} from "@/lib/dating-safety";
import { prisma } from "@/lib/prisma";
import { userDisplaySelect } from "@/lib/user-display";

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
      select: userDisplaySelect,
    },
  } satisfies Prisma.DatingProfileSelect;
}

const ownProfileSelect = {
  ...buildProfileSelect(),
  metadata: true,
} satisfies Prisma.DatingProfileSelect;
const publicProfileSelect = buildProfileSelect({ publicPhotosOnly: true });

export interface DatingProfileView {
  id: string;
  userId: string;
  status: DatingProfileStatus;
  headline: string | null;
  bio: string | null;
  lookingForText: string | null;
  metadata?: Prisma.JsonValue | null;
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
      id: string;
      handle: string | null;
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
  safetyAcknowledged?: boolean;
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

const discoveryBlockScopes = [
  DatingBlockScope.ALL,
  DatingBlockScope.DISCOVERY,
] satisfies DatingBlockScope[];
const messageBlockScopes = [
  DatingBlockScope.ALL,
  DatingBlockScope.MESSAGES,
] satisfies DatingBlockScope[];
const allBlockScopes = [
  DatingBlockScope.ALL,
  DatingBlockScope.DISCOVERY,
  DatingBlockScope.MESSAGES,
] satisfies DatingBlockScope[];

async function hasActiveDatingBlockBetween(
  profileAId: string,
  profileBId: string,
  scopes: DatingBlockScope[] = allBlockScopes,
) {
  const count = await prisma.datingBlock.count({
    where: {
      deletedAt: null,
      OR: [
        {
          blockedProfileId: profileAId,
          blockerProfileId: profileBId,
          scope: { in: scopes },
        },
        {
          blockedProfileId: profileBId,
          blockerProfileId: profileAId,
          scope: { in: scopes },
        },
      ],
    },
  });

  return count > 0;
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
  const existingProfile = await prisma.datingProfile.findUnique({
    select: { metadata: true },
    where: { userId },
  });
  const requestedStatus = input.status ?? DatingProfileStatus.ACTIVE;
  const alreadyAcknowledged = hasDatingSafetyAcknowledgement(
    existingProfile?.metadata,
  );

  if (
    requestedStatus === DatingProfileStatus.ACTIVE &&
    !alreadyAcknowledged &&
    !input.safetyAcknowledged
  ) {
    throw new Error("Confirm the Earth Optimization Mission safety rules first.");
  }

  const acknowledgedMetadata = input.safetyAcknowledged
    ? withDatingSafetyAcknowledgement(
        existingProfile?.metadata,
        now.toISOString(),
      )
    : null;
  const update = {
    bio: cleanText(input.bio, 2000),
    campaignDateIdeas: cleanStringList(input.campaignDateIdeas, 8),
    displayCity: cleanText(input.displayCity, 80),
    displayCountryCode: cleanText(input.displayCountryCode, 2)?.toUpperCase() ?? null,
    displayRegionCode: cleanText(input.displayRegionCode, 16)?.toUpperCase() ?? null,
    headline: cleanText(input.headline, 140),
    lastActiveAt: now,
    lookingForText: cleanText(input.lookingForText, 1000),
    ...(acknowledgedMetadata
      ? { metadata: acknowledgedMetadata as Prisma.InputJsonValue }
      : {}),
    profileCompletedAt: now,
    relationshipIntents: input.relationshipIntents ?? [],
    status: requestedStatus,
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
    throw new Error("Create a mission profile first.");
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

export async function getDatingDiscoverData(
  userId: string,
  options: { relationshipIntent?: DatingRelationshipIntent | null } = {},
) {
  const profile = await getOwnDatingProfile(userId);
  const candidates = await prisma.datingProfile.findMany({
    select: publicProfileSelect,
    orderBy: [{ lastActiveAt: "desc" }, { createdAt: "desc" }],
    take: 24,
    where: {
      deletedAt: null,
      status: DatingProfileStatus.ACTIVE,
      wantsCampaignDates: true,
      ...(options.relationshipIntent
        ? { relationshipIntents: { has: options.relationshipIntent } }
        : {}),
      ...(profile
        ? {
            blocksCreated: {
              none: {
                blockedProfileId: profile.id,
                deletedAt: null,
                scope: { in: discoveryBlockScopes },
              },
            },
            blocksReceived: {
              none: {
                blockerProfileId: profile.id,
                deletedAt: null,
                scope: { in: discoveryBlockScopes },
              },
            },
            id: { not: profile.id },
          }
        : {}),
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
    throw new Error("Mission profile not found.");
  }
  if (await hasActiveDatingBlockBetween(fromProfile.id, toProfile.id)) {
    throw new Error("This profile is blocked.");
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
      AND: [
        {
          profileA: {
            blocksCreated: {
              none: {
                blockedProfileId: profile.id,
                deletedAt: null,
                scope: { in: messageBlockScopes },
              },
            },
          },
        },
        {
          profileA: {
            blocksReceived: {
              none: {
                blockerProfileId: profile.id,
                deletedAt: null,
                scope: { in: messageBlockScopes },
              },
            },
          },
        },
        {
          profileB: {
            blocksCreated: {
              none: {
                blockedProfileId: profile.id,
                deletedAt: null,
                scope: { in: messageBlockScopes },
              },
            },
          },
        },
        {
          profileB: {
            blocksReceived: {
              none: {
                blockerProfileId: profile.id,
                deletedAt: null,
                scope: { in: messageBlockScopes },
              },
            },
          },
        },
      ],
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
      status: DatingConversationStatus.ACTIVE,
      match: {
        OR: [{ profileAId: profile.id }, { profileBId: profile.id }],
        status: DatingMatchStatus.ACTIVE,
      },
    },
  });

  if (conversation) {
    const otherProfileId =
      conversation.match.profileAId === profile.id
        ? conversation.match.profileBId
        : conversation.match.profileAId;

    if (
      await hasActiveDatingBlockBetween(
        profile.id,
        otherProfileId,
        messageBlockScopes,
      )
    ) {
      return { conversation: null, profile };
    }
  }

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
  const body = cleanText(input.body, 4000);

  if (!body) {
    throw new Error("Message cannot be empty.");
  }

  const message = await prisma.datingMessage.create({
    data: {
      body,
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
      status: DatingMatchStatus.ACTIVE,
    },
  });

  if (!match) {
    throw new Error("Match not found.");
  }
  const otherProfileId =
    match.profileAId === profile.id ? match.profileBId : match.profileAId;

  if (
    await hasActiveDatingBlockBetween(profile.id, otherProfileId, messageBlockScopes)
  ) {
    throw new Error("This match is blocked.");
  }

  const conversationId = cleanText(input.conversationId, 120);

  if (conversationId) {
    const conversation = await prisma.datingConversation.findFirst({
      select: { id: true },
      where: {
        deletedAt: null,
        id: conversationId,
        matchId: match.id,
        status: DatingConversationStatus.ACTIVE,
      },
    });

    if (!conversation) {
      throw new Error("Conversation not found.");
    }
  }

  return prisma.datingDatePlan.create({
    data: {
      campaignNotes: cleanText(input.campaignNotes, 1000),
      campaignTaskId: cleanText(input.campaignTaskId, 120),
      conversationId,
      isCampaignDate: input.isCampaignDate ?? false,
      locationName: cleanText(input.locationName, 200),
      matchId: match.id,
      proposedByProfileId: profile.id,
      startsAt: input.startsAt ?? null,
      title: cleanText(input.title, 140) ?? "Mission",
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
  const datePlanId = cleanText(input.datePlanId, 120);
  const messageId = cleanText(input.messageId, 120);
  let reportedProfileId = cleanText(input.reportedProfileId, 120);

  if (!datePlanId && !messageId && !reportedProfileId) {
    throw new Error("Choose a profile, message, or plan to report.");
  }

  if (messageId) {
    const message = await prisma.datingMessage.findFirst({
      select: {
        senderProfileId: true,
      },
      where: {
        deletedAt: null,
        id: messageId,
        conversation: {
          match: {
            OR: [{ profileAId: profile.id }, { profileBId: profile.id }],
          },
        },
      },
    });

    if (!message) {
      throw new Error("Message not found.");
    }

    if (message.senderProfileId !== profile.id) {
      reportedProfileId = reportedProfileId ?? message.senderProfileId;
    }
  }

  if (datePlanId) {
    const datePlan = await prisma.datingDatePlan.findFirst({
      select: { id: true },
      where: {
        deletedAt: null,
        id: datePlanId,
        OR: [
          { acceptedByProfileId: profile.id },
          { proposedByProfileId: profile.id },
          {
            match: {
              OR: [{ profileAId: profile.id }, { profileBId: profile.id }],
            },
          },
        ],
      },
    });

    if (!datePlan) {
      throw new Error("Date plan not found.");
    }
  }

  if (reportedProfileId) {
    if (reportedProfileId === profile.id) {
      throw new Error("You cannot report yourself.");
    }

    const reportedProfile = await prisma.datingProfile.findFirst({
      select: { id: true },
      where: { deletedAt: null, id: reportedProfileId },
    });

    if (!reportedProfile) {
      throw new Error("Reported profile not found.");
    }
  }

  return prisma.datingSafetyReport.create({
    data: {
      datePlanId,
      description: cleanText(input.description, 2000),
      messageId,
      reason: cleanText(input.reason, 200) ?? "Report",
      reportedProfileId,
      reporterProfileId: profile.id,
    },
  });
}

export async function createDatingBlock(
  userId: string,
  input: {
    blockedProfileId: string;
    reason?: string | null;
    scope?: DatingBlockScope;
  },
) {
  const profile = await requireOwnDatingProfile(userId);
  const blockedProfileId = cleanText(input.blockedProfileId, 120);

  if (!blockedProfileId) {
    throw new Error("Choose a profile to block.");
  }
  if (blockedProfileId === profile.id) {
    throw new Error("You cannot block yourself.");
  }

  const blockedProfile = await prisma.datingProfile.findFirst({
    select: { id: true },
    where: { deletedAt: null, id: blockedProfileId },
  });

  if (!blockedProfile) {
    throw new Error("Mission profile not found.");
  }

  const [profileAId, profileBId] = canonicalProfilePair(
    profile.id,
    blockedProfile.id,
  );
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const block = await tx.datingBlock.upsert({
      create: {
        blockedProfileId: blockedProfile.id,
        blockerProfileId: profile.id,
        reason: cleanText(input.reason, 500),
        scope: input.scope ?? DatingBlockScope.ALL,
      },
      update: {
        deletedAt: null,
        reason: cleanText(input.reason, 500),
        scope: input.scope ?? DatingBlockScope.ALL,
      },
      where: {
        blockerProfileId_blockedProfileId: {
          blockedProfileId: blockedProfile.id,
          blockerProfileId: profile.id,
        },
      },
    });

    await tx.datingMatch.updateMany({
      data: {
        status: DatingMatchStatus.BLOCKED,
        unmatchedAt: now,
      },
      where: {
        deletedAt: null,
        profileAId,
        profileBId,
      },
    });
    await tx.datingConversation.updateMany({
      data: { status: DatingConversationStatus.ARCHIVED },
      where: {
        deletedAt: null,
        match: {
          profileAId,
          profileBId,
        },
      },
    });

    return block;
  });
}
