import {
  TaskCategory,
  TaskClaimPolicy,
  TaskClaimStatus,
  TaskEngagementKind,
  TaskRemotePolicy,
  TaskStatus,
} from "@optimitron/db";
import type { Prisma } from "@optimitron/db";
import {
  FLYER_HANG_PLACE_TASK_KEY_PREFIX,
  FLYER_HANG_PROGRAM_TASK_KEY,
  TREATY_PARENT_TASK_ID,
  USER_TREATY_HANG_FLYERS_SUBTASK_KIND,
  getUserHangFlyersTaskKey,
  getUserTreatyTaskKey,
} from "@optimitron/db/task-keys";
import { prisma } from "@/lib/prisma";
import { ROUTES, getTaskPath } from "@/lib/routes";
import {
  FLYER_HANG_GRID_SLOTS,
  FLYER_HANG_NEARBY_LIMIT,
  FLYER_HANG_SEARCH_RADIUS_KM,
  FLYER_HANG_STALE_AFTER_DAYS,
} from "./constants";
import {
  buildGridSlotPlaceCandidates,
  fetchOverpassFlyerHangPlaces,
  haversineKm,
  taskKeyForFlyerHangPlace,
  type FlyerHangPlaceCandidate,
} from "./places";
import { compareFlyerHangPriority, getFlyerHangFreshness } from "./staleness";
import type { FlyerHangNearbyTask } from "./types";

export type { FlyerHangNearbyTask };

type EnsureDb = Prisma.TransactionClient | typeof prisma;

function parseFlyerHangSource(taskKey: string | null | undefined) {
  if (!taskKey?.startsWith(`${FLYER_HANG_PLACE_TASK_KEY_PREFIX}:`)) {
    return "unknown";
  }
  return taskKey.slice(`${FLYER_HANG_PLACE_TASK_KEY_PREFIX}:`.length).split(":")[0] ??
    "unknown";
}

async function resolveFlyerHangProgramParentId(
  db: EnsureDb,
  createdByUserId: string,
) {
  // upsert, not findFirst-then-create: two concurrent first-callers can both
  // miss the findFirst and both attempt create, and taskKey is unique, so
  // the loser would throw and 500 the route. upsert lets Postgres resolve
  // the race atomically.
  const task = await db.task.upsert({
    where: { taskKey: FLYER_HANG_PROGRAM_TASK_KEY },
    create: {
      category: TaskCategory.OUTREACH,
      claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
      createdByUserId,
      description:
        "Shared inventory of places where humans hang 1% Treaty referral flyers. Child tasks are claimable hang spots. One hang does not close the place — flyers go stale and need rehangs.",
      engagementKind: TaskEngagementKind.ONGOING,
      isPublic: true,
      parentTaskId: TREATY_PARENT_TASK_ID,
      status: TaskStatus.ACTIVE,
      taskKey: FLYER_HANG_PROGRAM_TASK_KEY,
      title: "Hang referral flyers in public places",
    },
    update: {},
    select: { id: true },
  });
  return task.id;
}

function descriptionForPlace(place: FlyerHangPlaceCandidate) {
  if (place.source === "grid" && place.slotId) {
    const slot = FLYER_HANG_GRID_SLOTS.find((s) => s.id === place.slotId);
    if (slot) return slot.description;
  }
  return [
    `Print your referral poster from ${ROUTES.poster}.`,
    `Ask before you tape anything at ${place.name}.`,
    "Photograph the hung flyer.",
    "Mark this hang done so nearby humans know the board is covered.",
    `Rehang after about ${FLYER_HANG_STALE_AFTER_DAYS} days when the paper is gone or stale.`,
  ].join(" ");
}

function contextJsonForPlace(place: FlyerHangPlaceCandidate) {
  return {
    kind: "flyer-hang-place",
    placeId: place.placeId,
    placeName: place.name,
    slotId: place.slotId ?? null,
    source: place.source,
    staleAfterDays: FLYER_HANG_STALE_AFTER_DAYS,
  } satisfies Prisma.InputJsonObject;
}

async function upsertPlaceTask(
  db: EnsureDb,
  input: {
    createdByUserId: string;
    parentTaskId: string;
    place: FlyerHangPlaceCandidate;
  },
) {
  const taskKey = taskKeyForFlyerHangPlace(input.place);
  const title =
    input.place.source === "grid" && input.place.slotId
      ? (FLYER_HANG_GRID_SLOTS.find((s) => s.id === input.place.slotId)?.title ??
        input.place.name)
      : `Hang a flyer at ${input.place.name}`;
  const locationText = [
    input.place.name,
    input.place.city,
    input.place.regionCode,
    input.place.countryCode,
  ]
    .filter(Boolean)
    .join(", ");

  return db.task.upsert({
    where: { taskKey },
    create: {
      category: TaskCategory.OUTREACH,
      claimPolicy: TaskClaimPolicy.OPEN_MANY,
      contextJson: contextJsonForPlace(input.place),
      createdByUserId: input.createdByUserId,
      description: descriptionForPlace(input.place),
      engagementKind: TaskEngagementKind.ONGOING,
      estimatedEffortHours: 0.25,
      interestTags: ["flyer", "poster", "outreach", "1-percent-treaty"],
      isPublic: true,
      locationText,
      parentTaskId: input.parentTaskId,
      remotePolicy: TaskRemotePolicy.ONSITE,
      skillTags: ["print", "local-outreach"],
      status: TaskStatus.ACTIVE,
      taskKey,
      title,
      workLocationCity: input.place.city,
      workLocationCountryCode: input.place.countryCode,
      workLocationLatitude: input.place.latitude,
      workLocationLongitude: input.place.longitude,
      workLocationRadiusKm: FLYER_HANG_SEARCH_RADIUS_KM,
      workLocationRegionCode: input.place.regionCode,
    },
    update: {
      description: descriptionForPlace(input.place),
      locationText,
      title,
      workLocationCity: input.place.city,
      workLocationCountryCode: input.place.countryCode,
      workLocationLatitude: input.place.latitude,
      workLocationLongitude: input.place.longitude,
      workLocationRadiusKm: FLYER_HANG_SEARCH_RADIUS_KM,
      workLocationRegionCode: input.place.regionCode,
    },
    select: {
      id: true,
      locationText: true,
      taskKey: true,
      title: true,
      workLocationLatitude: true,
      workLocationLongitude: true,
    },
  });
}

async function loadLastHungAtByTaskId(
  db: EnsureDb,
  taskIds: string[],
): Promise<Map<string, Date>> {
  if (taskIds.length === 0) return new Map();
  // Verifying a claim on a public task requires an admin (see
  // getTaskAccessWhere's VERIFY boundary in tasks.server.ts), and flyer-hang
  // place tasks are public with an open-ended flow of claimants — admin
  // review of every hang isn't realistic. Treat a claimant's own COMPLETED
  // report (photo evidence required by completeTaskClaim) as "hung" too, so
  // "Needs first hang" clears through the normal user flow instead of
  // staying stuck pending an admin who will never see most of these.
  const claims = await db.taskClaim.findMany({
    where: {
      deletedAt: null,
      status: { in: [TaskClaimStatus.COMPLETED, TaskClaimStatus.VERIFIED] },
      taskId: { in: taskIds },
    },
    select: {
      completedAt: true,
      taskId: true,
      verifiedAt: true,
    },
  });
  // Pick the most recent hang per task explicitly in JS rather than leaning
  // on SQL ORDER BY + first-row-wins: verifiedAt is null for COMPLETED-only
  // claims, and DB null-ordering defaults aren't something to depend on for
  // correctness here.
  const map = new Map<string, Date>();
  for (const claim of claims) {
    const at = claim.verifiedAt ?? claim.completedAt;
    if (!at) continue;
    const current = map.get(claim.taskId);
    if (!current || at.getTime() > current.getTime()) {
      map.set(claim.taskId, at);
    }
  }
  return map;
}

export async function ensurePersonalHangFlyersTask(
  input: {
    createdByUserId: string;
    personId?: string | null;
    userId: string;
  },
  db: EnsureDb = prisma,
) {
  const taskKey = getUserHangFlyersTaskKey(input.userId);
  const parentKey = getUserTreatyTaskKey(input.userId);
  const parent = await db.task.findFirst({
    where: { deletedAt: null, taskKey: parentKey },
    select: { id: true },
  });

  return db.task.upsert({
    where: { taskKey },
    create: {
      assigneePersonId: input.personId ?? null,
      category: TaskCategory.OUTREACH,
      claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
      contextJson: {
        kind: "flyer-hang-plan",
        subtaskKind: USER_TREATY_HANG_FLYERS_SUBTASK_KIND,
      },
      createdByUserId: input.createdByUserId,
      description: [
        "Print your personal referral poster.",
        "Open the hang list for places near you.",
        "Claim a spot, hang the flyer after you ask permission, photograph it, and mark the hang done.",
        "Rehang when a spot goes stale (~21 days).",
      ].join(" "),
      estimatedEffortHours: 0.5,
      interestTags: ["flyer", "poster", "outreach"],
      isPublic: false,
      parentTaskId: parent?.id ?? null,
      status: TaskStatus.ACTIVE,
      taskKey,
      title: "Print and hang referral flyers near you",
    },
    update: {
      assigneePersonId: input.personId ?? undefined,
      parentTaskId: parent?.id ?? undefined,
    },
    select: { id: true, taskKey: true },
  });
}

export async function ensureNearbyFlyerHangTasks(input: {
  city?: string | null;
  countryCode?: string | null;
  createdByUserId: string;
  fetchOverpass?: typeof fetchOverpassFlyerHangPlaces;
  latitude: number;
  limit?: number;
  longitude: number;
  personId?: string | null;
  regionCode?: string | null;
  userId: string;
}): Promise<{
  personalTaskId: string;
  places: FlyerHangNearbyTask[];
  usedOverpass: boolean;
}> {
  const limit = input.limit ?? FLYER_HANG_NEARBY_LIMIT;
  const origin = {
    latitude: input.latitude,
    longitude: input.longitude,
  };

  const gridPlaces = buildGridSlotPlaceCandidates({
    city: input.city,
    countryCode: input.countryCode,
    latitude: input.latitude,
    longitude: input.longitude,
    regionCode: input.regionCode,
  });

  let osmPlaces: FlyerHangPlaceCandidate[] = [];
  let usedOverpass = false;
  const fetchPlaces = input.fetchOverpass ?? fetchOverpassFlyerHangPlaces;
  try {
    osmPlaces = await fetchPlaces(origin);
    usedOverpass = true;
  } catch {
    usedOverpass = false;
  }

  const merged: FlyerHangPlaceCandidate[] = [];
  const seen = new Set<string>();
  for (const place of [...osmPlaces, ...gridPlaces]) {
    const key = taskKeyForFlyerHangPlace(place);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(place);
    if (merged.length >= limit) break;
  }

  const parentTaskId = await resolveFlyerHangProgramParentId(
    prisma,
    input.createdByUserId,
  );
  const personal = await ensurePersonalHangFlyersTask({
    createdByUserId: input.createdByUserId,
    personId: input.personId,
    userId: input.userId,
  });

  const upserted = [];
  for (const place of merged) {
    upserted.push(
      await upsertPlaceTask(prisma, {
        createdByUserId: input.createdByUserId,
        parentTaskId,
        place,
      }),
    );
  }

  const lastHung = await loadLastHungAtByTaskId(
    prisma,
    upserted.map((task) => task.id),
  );

  const places: FlyerHangNearbyTask[] = upserted
    .map((task) => {
      const latitude = task.workLocationLatitude ?? origin.latitude;
      const longitude = task.workLocationLongitude ?? origin.longitude;
      const lastHungAt = lastHung.get(task.id) ?? null;
      const freshness = getFlyerHangFreshness({ lastHungAt });
      return {
        distanceKm: haversineKm(origin, { latitude, longitude }),
        freshness,
        href: getTaskPath(task.id),
        id: task.id,
        lastHungAt: lastHungAt?.toISOString() ?? null,
        latitude,
        locationText: task.locationText,
        longitude,
        name: task.locationText?.split(",")[0] ?? task.title,
        source: parseFlyerHangSource(task.taskKey),
        taskKey: task.taskKey ?? "",
        title: task.title,
      };
    })
    .sort((a, b) =>
      compareFlyerHangPriority(
        {
          distanceKm: a.distanceKm,
          isStale: a.freshness.isStale,
          lastHungAt: a.freshness.lastHungAt,
        },
        {
          distanceKm: b.distanceKm,
          isStale: b.freshness.isStale,
          lastHungAt: b.freshness.lastHungAt,
        },
      ),
    );

  return {
    personalTaskId: personal.id,
    places,
    usedOverpass,
  };
}
