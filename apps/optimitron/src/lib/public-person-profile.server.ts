import { cachePublicRead, PUBLIC_TASK_READ_CACHE_TAG } from "@/lib/public-read-cache.server";
import { getPersonTaskProfileData } from "@/lib/tasks.server";
import { getRepresentedPersonProfileData } from "@/lib/represented-people.server";
import {
  PUBLIC_PERSON_PROFILE_CACHE_TAG,
  PUBLIC_PERSON_PROFILE_REVALIDATE_SECONDS,
} from "@/lib/person-profile-cache";

// Metadata, page content, and share images must use the same public cache.
// Keep the existing profile expiration and visibility-change invalidation policy.
export const getCachedRepresentedPersonProfileData = cachePublicRead(
  getRepresentedPersonProfileData,
  "public-represented-person-profile-v2",
  [PUBLIC_PERSON_PROFILE_CACHE_TAG, PUBLIC_TASK_READ_CACHE_TAG],
  PUBLIC_PERSON_PROFILE_REVALIDATE_SECONDS,
);

export const getCachedPersonTaskProfileData = cachePublicRead(
  (id: string) => getPersonTaskProfileData(id, null),
  "public-person-task-profile-v2",
  [PUBLIC_PERSON_PROFILE_CACHE_TAG, PUBLIC_TASK_READ_CACHE_TAG],
  PUBLIC_PERSON_PROFILE_REVALIDATE_SECONDS,
);
